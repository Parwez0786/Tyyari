package com.interview.auth.service;

import com.interview.auth.dto.InviteUserResult;
import com.interview.auth.dto.LoginResponse;
import com.interview.auth.dto.MeResponse;
import com.interview.auth.dto.SupportMailResult;
import com.interview.auth.event.UserEventPublisher;
import com.interview.auth.exception.ApiException;
import com.interview.auth.exception.ErrorCode;
import com.interview.auth.model.EmailVerificationToken;
import com.interview.auth.model.PasswordResetToken;
import com.interview.auth.model.RefreshToken;
import com.interview.auth.model.User;
import com.interview.auth.repository.EmailVerificationTokenRepository;
import com.interview.auth.repository.PasswordResetTokenRepository;
import com.interview.auth.repository.RefreshTokenRepository;
import com.interview.auth.repository.UserRepository;
import com.interview.auth.security.JwtService;
import com.interview.auth.security.TokenHasher;
import com.interview.auth.util.EmailAddresses;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final EmailVerificationTokenRepository emailTokens;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenHasher tokenHasher;
    private final UserEventPublisher events;
    private final MailService mailService;
    private final SessionBan sessionBan;
    private final long refreshTokenDays;
    private final String frontendUrl;

    public AuthService(
            UserRepository users,
            RefreshTokenRepository refreshTokens,
            EmailVerificationTokenRepository emailTokens,
            PasswordResetTokenRepository resetTokens,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            TokenHasher tokenHasher,
            UserEventPublisher events,
            MailService mailService,
            SessionBan sessionBan,
            @Value("${jwt.refresh-token-days}") long refreshTokenDays,
            @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.emailTokens = emailTokens;
        this.resetTokens = resetTokens;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.tokenHasher = tokenHasher;
        this.events = events;
        this.mailService = mailService;
        this.sessionBan = sessionBan;
        this.refreshTokenDays = refreshTokenDays;
        this.frontendUrl = frontendUrl;
    }

    public String register(String name, String email, String password) {
        String normalized = EmailAddresses.normalize(email);
        if (!EmailAddresses.isValid(normalized)) {
            throw new ApiException(ErrorCode.AUTH_INVALID_EMAIL, "Enter a valid email address", HttpStatus.BAD_REQUEST);
        }
        if (users.existsByEmail(normalized)) {
            throw new ApiException(ErrorCode.AUTH_EMAIL_TAKEN, "Email already registered", HttpStatus.CONFLICT);
        }
        Instant now = Instant.now();
        User user = users.save(User.builder()
                .email(normalized)
                .passwordHash(passwordEncoder.encode(password))
                .role(User.Role.USER)
                .status(User.Status.ACTIVE)
                .emailVerified(false)
                .provider("LOCAL")
                .createdAt(now)
                .updatedAt(now)
                .build());

        String verifyRaw = issueVerificationToken(user.getId(), now);
        try {
            mailService.sendVerification(normalized, name, verifyRaw);
        } catch (RuntimeException e) {
            emailTokens.deleteByUserId(user.getId());
            users.deleteById(user.getId());
            throw new ApiException(
                    ErrorCode.AUTH_INVALID_EMAIL,
                    "Could not send a verification email to that address. Use a valid inbox.",
                    HttpStatus.BAD_REQUEST
            );
        }

        events.publishRegistered(user.getId(), user.getEmail(), name);
        return user.getId();
    }

    public LoginResponse login(String email, String password, String device) {
        User user = users.findByEmail(EmailAddresses.normalize(email))
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid credentials", HttpStatus.UNAUTHORIZED));
        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new ApiException(ErrorCode.AUTH_USE_GOOGLE, "This account uses Google or GitHub sign-in", HttpStatus.UNAUTHORIZED);
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ApiException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid credentials", HttpStatus.UNAUTHORIZED);
        }
        rejectIfDisabled(user);
        if (!user.isEmailVerified()) {
            throw new ApiException(
                    ErrorCode.AUTH_EMAIL_UNVERIFIED,
                    "Verify your email before signing in. Check your inbox for the link.",
                    HttpStatus.FORBIDDEN
            );
        }
        return issueTokens(user, device);
    }

    public LoginResponse refresh(String refreshToken, String device) {
        RefreshToken stored = refreshTokens.findByTokenHashAndRevokedFalse(tokenHasher.hash(refreshToken))
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Invalid refresh token", HttpStatus.UNAUTHORIZED));
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            stored.setRevoked(true);
            refreshTokens.save(stored);
            throw new ApiException(ErrorCode.AUTH_TOKEN_EXPIRED, "Refresh token expired", HttpStatus.UNAUTHORIZED);
        }
        stored.setRevoked(true);
        refreshTokens.save(stored);
        User user = users.findById(stored.getUserId())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
        if (user.getStatus() != User.Status.ACTIVE) {
            refreshTokens.deleteByUserId(user.getId());
            rejectIfDisabled(user);
        }
        return issueTokens(user, device);
    }

    public void logout(String refreshToken) {
        refreshTokens.findByTokenHashAndRevokedFalse(tokenHasher.hash(refreshToken)).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokens.save(token);
        });
    }

    public MeResponse me(String userId) {
        User user = users.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
        return new MeResponse(user.getId(), user.getEmail(), user.getRole().name(), isPremium(user));
    }

    public boolean isPremium(User user) {
        if (user.getRole() == User.Role.ADMIN) {
            return true;
        }
        if (!user.isPremium()) {
            return false;
        }
        return user.getPremiumUntil() == null || user.getPremiumUntil().isAfter(Instant.now());
    }

    public User requireUser(String userId) {
        return users.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
    }

    public User grantPremium(String userId) {
        return grantPremium(userId, null);
    }

    public User grantPremium(String userId, Instant until) {
        User user = requireUser(userId);
        user.setPremium(true);
        user.setPremiumUntil(until);
        user.setUpdatedAt(Instant.now());
        return users.save(user);
    }

    public User revokePremium(String userId) {
        User user = requireUser(userId);
        if (user.getRole() == User.Role.ADMIN) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Cannot revoke Premium on an admin account", HttpStatus.BAD_REQUEST);
        }
        user.setPremium(false);
        user.setPremiumUntil(null);
        user.setUpdatedAt(Instant.now());
        return users.save(user);
    }

    public void verifyEmail(String token) {
        EmailVerificationToken stored = emailTokens.findByTokenHash(tokenHasher.hash(token))
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Invalid verification token", HttpStatus.BAD_REQUEST));
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(ErrorCode.AUTH_TOKEN_EXPIRED, "Verification token expired", HttpStatus.BAD_REQUEST);
        }
        User user = users.findById(stored.getUserId())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
        user.setEmailVerified(true);
        user.setUpdatedAt(Instant.now());
        users.save(user);
        emailTokens.deleteByUserId(user.getId());
        try {
            mailService.sendWelcome(user.getEmail(), null);
        } catch (RuntimeException e) {
            log.warn("Welcome email failed after verification for {}", user.getEmail(), e);
        }
    }

    public void forgotPassword(String email) {
        users.findByEmail(EmailAddresses.normalize(email)).ifPresent(user -> {
            String raw = tokenHasher.randomToken();
            Instant now = Instant.now();
            resetTokens.save(PasswordResetToken.builder()
                    .userId(user.getId())
                    .tokenHash(tokenHasher.hash(raw))
                    .expiresAt(now.plus(1, ChronoUnit.HOURS))
                    .createdAt(now)
                    .used(false)
                    .build());
            log.info("Password reset token for {}: {}", user.getEmail(), raw);
            mailService.sendPasswordReset(user.getEmail(), raw);
        });
    }

    public void resendVerification(String email) {
        String normalized = EmailAddresses.normalize(email);
        if (!EmailAddresses.isValid(normalized)) {
            return;
        }
        users.findByEmail(normalized).ifPresent(user -> {
            if (user.isEmailVerified()) {
                return;
            }
            Instant now = Instant.now();
            String verifyRaw = issueVerificationToken(user.getId(), now);
            try {
                mailService.sendVerification(user.getEmail(), null, verifyRaw);
            } catch (RuntimeException e) {
                log.warn("Verification email failed for {}", normalized, e);
            }
        });
    }

    public void resetPassword(String token, String password) {
        PasswordResetToken stored = resetTokens.findByTokenHashAndUsedFalse(tokenHasher.hash(token))
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Invalid reset token", HttpStatus.BAD_REQUEST));
        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(ErrorCode.AUTH_TOKEN_EXPIRED, "Reset token expired", HttpStatus.BAD_REQUEST);
        }
        User user = users.findById(stored.getUserId())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setUpdatedAt(Instant.now());
        users.save(user);
        stored.setUsed(true);
        resetTokens.save(stored);
        refreshTokens.deleteByUserId(user.getId());
        sessionBan.block(user.getId());
    }

    public List<User> listUsers() {
        return users.findAll();
    }

    public User getUser(String userId) {
        return users.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
    }

    public SupportMailResult sendPasswordResetForUser(String userId) {
        User user = getUser(userId);
        if (user.getRole() == User.Role.ADMIN) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Cannot reset an admin password from support", HttpStatus.BAD_REQUEST);
        }
        String raw = tokenHasher.randomToken();
        Instant now = Instant.now();
        resetTokens.save(PasswordResetToken.builder()
                .userId(user.getId())
                .tokenHash(tokenHasher.hash(raw))
                .expiresAt(now.plus(1, ChronoUnit.HOURS))
                .createdAt(now)
                .used(false)
                .build());
        String actionUrl = frontendUrl + "/reset-password?token=" + raw;
        boolean sent = true;
        String message = "Reset email sent. Link expires in 1 hour.";
        try {
            mailService.sendPasswordReset(user.getEmail(), raw);
        } catch (RuntimeException e) {
            sent = false;
            message = "Email was not delivered. Copy the reset link.";
            log.warn("Support reset email failed for {}", user.getEmail(), e);
        }
        return new SupportMailResult(sent, user.getEmail(), actionUrl, message);
    }

    public User forceVerifyEmail(String userId) {
        User user = getUser(userId);
        if (user.getRole() == User.Role.ADMIN) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Cannot change verification on an admin account", HttpStatus.BAD_REQUEST);
        }
        if (user.isEmailVerified()) {
            return user;
        }
        user.setEmailVerified(true);
        user.setUpdatedAt(Instant.now());
        users.save(user);
        emailTokens.deleteByUserId(user.getId());
        return user;
    }

    public SupportMailResult resendVerificationForUser(String userId) {
        User user = getUser(userId);
        if (user.isEmailVerified()) {
            return new SupportMailResult(false, user.getEmail(), null, "This inbox is already verified.");
        }
        Instant now = Instant.now();
        String raw = issueVerificationToken(user.getId(), now);
        String encoded = java.net.URLEncoder.encode(raw, java.nio.charset.StandardCharsets.UTF_8);
        String actionUrl = frontendUrl + "/verify-email?token=" + encoded;
        boolean sent = true;
        String message = "Verification email sent. Link expires in 2 days.";
        try {
            mailService.sendVerification(user.getEmail(), null, raw);
        } catch (RuntimeException e) {
            sent = false;
            message = "Email was not delivered. Copy the verification link.";
            log.warn("Support verification email failed for {}", user.getEmail(), e);
        }
        return new SupportMailResult(sent, user.getEmail(), actionUrl, message);
    }

    public User updateStatus(String userId, User.Status status) {
        User user = users.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
        user.setStatus(status);
        user.setUpdatedAt(Instant.now());
        User saved = users.save(user);
        if (status == User.Status.DISABLED) {
            refreshTokens.deleteByUserId(user.getId());
            sessionBan.block(user.getId());
        }
        return saved;
    }

    public void revokeSessions(String userId) {
        User user = getUser(userId);
        if (user.getRole() == User.Role.ADMIN) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Cannot revoke admin sessions from support", HttpStatus.BAD_REQUEST);
        }
        refreshTokens.deleteByUserId(user.getId());
        sessionBan.block(user.getId());
    }

    public InviteUserResult inviteUser(String email, String name, String roleName) {
        String normalized = EmailAddresses.normalize(email);
        if (!EmailAddresses.isValid(normalized)) {
            throw new ApiException(ErrorCode.AUTH_INVALID_EMAIL, "Enter a valid email address", HttpStatus.BAD_REQUEST);
        }
        if (users.existsByEmail(normalized)) {
            throw new ApiException(ErrorCode.AUTH_EMAIL_TAKEN, "Email already registered", HttpStatus.CONFLICT);
        }
        User.Role role = parseAssignableRole(roleName);
        Instant now = Instant.now();
        String displayName = name == null || name.isBlank() ? null : name.trim();
        User user = users.save(User.builder()
                .email(normalized)
                .passwordHash(passwordEncoder.encode(tokenHasher.randomToken()))
                .role(role)
                .status(User.Status.ACTIVE)
                .emailVerified(true)
                .provider("LOCAL")
                .createdAt(now)
                .updatedAt(now)
                .build());
        events.publishRegistered(user.getId(), user.getEmail(), displayName == null ? user.getEmail() : displayName);

        String raw = tokenHasher.randomToken();
        resetTokens.save(PasswordResetToken.builder()
                .userId(user.getId())
                .tokenHash(tokenHasher.hash(raw))
                .expiresAt(now.plus(1, ChronoUnit.HOURS))
                .createdAt(now)
                .used(false)
                .build());
        String actionUrl = frontendUrl + "/reset-password?token=" + raw;
        boolean sent = true;
        String message = "Invite sent. They have 1 hour to set a password.";
        try {
            mailService.sendInvite(user.getEmail(), displayName, raw);
        } catch (RuntimeException e) {
            sent = false;
            message = "Account created. Email was not delivered. Copy the set-password link.";
            log.warn("Invite email failed for {}", user.getEmail(), e);
        }
        return new InviteUserResult(user.getId(), user.getEmail(), user.getRole().name(), sent, actionUrl, message);
    }

    public User updateRole(String userId, String roleName) {
        User user = getUser(userId);
        if (user.getRole() == User.Role.ADMIN) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Cannot change an admin role", HttpStatus.BAD_REQUEST);
        }
        user.setRole(parseAssignableRole(roleName));
        user.setUpdatedAt(Instant.now());
        return users.save(user);
    }

    private User.Role parseAssignableRole(String roleName) {
        if (roleName == null || roleName.isBlank() || "USER".equalsIgnoreCase(roleName.trim())) {
            return User.Role.USER;
        }
        if ("EDITOR".equalsIgnoreCase(roleName.trim())) {
            return User.Role.EDITOR;
        }
        throw new ApiException(ErrorCode.VALIDATION_ERROR, "Assign USER or EDITOR only", HttpStatus.BAD_REQUEST);
    }

    private String issueVerificationToken(String userId, Instant now) {
        emailTokens.deleteByUserId(userId);
        String verifyRaw = tokenHasher.randomToken();
        emailTokens.save(EmailVerificationToken.builder()
                .userId(userId)
                .tokenHash(tokenHasher.hash(verifyRaw))
                .expiresAt(now.plus(2, ChronoUnit.DAYS))
                .createdAt(now)
                .build());
        return verifyRaw;
    }

    public void rejectIfDisabled(User user) {
        if (user.getStatus() == User.Status.DISABLED) {
            throw new ApiException(
                    ErrorCode.AUTH_ACCOUNT_DISABLED,
                    "This account is disabled. Contact support if you think this is a mistake.",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    public LoginResponse issueTokens(User user, String device) {
        rejectIfDisabled(user);
        sessionBan.clear(user.getId());
        String access = jwtService.generateAccessToken(user.getId(), user.getRole().name(), isPremium(user));
        String refreshRaw = tokenHasher.randomToken();
        Instant now = Instant.now();
        refreshTokens.save(RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(tokenHasher.hash(refreshRaw))
                .expiresAt(now.plus(refreshTokenDays, ChronoUnit.DAYS))
                .device(device)
                .createdAt(now)
                .revoked(false)
                .build());
        return new LoginResponse(access, refreshRaw, jwtService.getAccessTokenSeconds());
    }
}
