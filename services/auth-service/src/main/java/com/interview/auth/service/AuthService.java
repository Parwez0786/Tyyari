package com.interview.auth.service;

import com.interview.auth.dto.InviteUserResult;
import com.interview.auth.dto.LoginResponse;
import com.interview.auth.dto.MeResponse;
import com.interview.auth.dto.SupportMailResult;
import com.interview.auth.dto.TotpSetupResponse;
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
    private final TotpService totpService;
    private final TotpChallengeStore totpChallenges;
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
            TotpService totpService,
            TotpChallengeStore totpChallenges,
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
        this.totpService = totpService;
        this.totpChallenges = totpChallenges;
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

    public LoginResponse login(String email, String password, String device, boolean staffConsole) {
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
        if (staffConsole) {
            requireStaffConsole(user);
        }
        return finishLogin(user, device);
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
        return new MeResponse(user.getId(), user.getEmail(), user.getRole().name(), isPremium(user), user.isTotpEnabled());
    }

    public boolean isPremium(User user) {
        if (user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.EDITOR) {
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
        rejectIfDeleting(user);
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
        rejectIfDeleting(user);
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
            mailService.sendPasswordReset(user.getEmail(), raw, isStaff(user));
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

    public SupportMailResult sendPasswordResetForUser(String actorId, String userId) {
        rejectSelf(actorId, userId, "reset your own password from support");
        User user = getUser(userId);
        rejectIfDeleting(user);
        String raw = tokenHasher.randomToken();
        Instant now = Instant.now();
        resetTokens.save(PasswordResetToken.builder()
                .userId(user.getId())
                .tokenHash(tokenHasher.hash(raw))
                .expiresAt(now.plus(1, ChronoUnit.HOURS))
                .createdAt(now)
                .used(false)
                .build());
        String actionUrl = mailService.appUrl(isStaff(user)) + "/reset-password?token=" + raw;
        boolean sent = true;
        String message = "Reset email sent. Link expires in 1 hour.";
        try {
            mailService.sendPasswordReset(user.getEmail(), raw, isStaff(user));
        } catch (RuntimeException e) {
            sent = false;
            message = "Email was not delivered. Copy the reset link.";
            log.warn("Support reset email failed for {}", user.getEmail(), e);
        }
        return new SupportMailResult(sent, user.getEmail(), actionUrl, message);
    }

    public User forceVerifyEmail(String actorId, String userId) {
        rejectSelf(actorId, userId, "change verification on your own account");
        User user = getUser(userId);
        rejectIfDeleting(user);
        if (user.isEmailVerified()) {
            return user;
        }
        user.setEmailVerified(true);
        user.setUpdatedAt(Instant.now());
        users.save(user);
        emailTokens.deleteByUserId(user.getId());
        return user;
    }

    public SupportMailResult changeEmail(String actorId, String userId, String email) {
        rejectSelf(actorId, userId, "change your own email from support");
        User user = getUser(userId);
        rejectIfDeleting(user);
        if (user.getProvider() != null && !"LOCAL".equalsIgnoreCase(user.getProvider())) {
            throw new ApiException(
                    ErrorCode.VALIDATION_ERROR,
                    "This account signs in with " + user.getProvider() + ". Change the email on that provider.",
                    HttpStatus.BAD_REQUEST
            );
        }
        String normalized = EmailAddresses.normalize(email);
        if (!EmailAddresses.isValid(normalized)) {
            throw new ApiException(ErrorCode.AUTH_INVALID_EMAIL, "Enter a valid email address", HttpStatus.BAD_REQUEST);
        }
        if (normalized.equals(user.getEmail())) {
            return new SupportMailResult(false, user.getEmail(), null, "This is already the login email.");
        }
        if (users.existsByEmail(normalized)) {
            throw new ApiException(ErrorCode.AUTH_EMAIL_TAKEN, "Another account already uses that email", HttpStatus.CONFLICT);
        }
        user.setEmail(normalized);
        user.setEmailVerified(false);
        user.setUpdatedAt(Instant.now());
        users.save(user);
        refreshTokens.deleteByUserId(user.getId());
        sessionBan.block(user.getId());

        Instant now = Instant.now();
        String raw = issueVerificationToken(user.getId(), now);
        String encoded = java.net.URLEncoder.encode(raw, java.nio.charset.StandardCharsets.UTF_8);
        String actionUrl = frontendUrl + "/verify-email?token=" + encoded;
        boolean sent = true;
        String message = "Login email updated. They must verify the new inbox before signing in.";
        try {
            mailService.sendVerification(user.getEmail(), null, raw);
        } catch (RuntimeException e) {
            sent = false;
            message = "Email was updated. Verification mail was not delivered. Copy the link.";
            log.warn("Support change-email verification failed for {}", user.getEmail(), e);
        }
        return new SupportMailResult(sent, user.getEmail(), actionUrl, message);
    }

    public SupportMailResult resendVerificationForUser(String userId) {
        User user = getUser(userId);
        rejectIfDeleting(user);
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

    public User updateStatus(String actorId, String userId, User.Status status) {
        rejectSelf(actorId, userId, "change your own status");
        User user = users.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
        rejectIfDeleting(user);
        if (status == User.Status.DISABLED) {
            rejectLastAdmin(user, "disable");
        }
        if (status == User.Status.DELETING) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Use delete account to wipe this user", HttpStatus.BAD_REQUEST);
        }
        user.setStatus(status);
        user.setUpdatedAt(Instant.now());
        User saved = users.save(user);
        if (status == User.Status.DISABLED) {
            refreshTokens.deleteByUserId(user.getId());
            sessionBan.block(user.getId());
        }
        return saved;
    }

    public void revokeSessions(String actorId, String userId) {
        rejectSelf(actorId, userId, "revoke your own sessions from support");
        User user = getUser(userId);
        rejectIfDeleting(user);
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
        String actionUrl = mailService.appUrl(isStaff(user)) + "/reset-password?token=" + raw;
        boolean sent = true;
        String message = "Invite sent. They have 1 hour to set a password.";
        try {
            mailService.sendInvite(user.getEmail(), displayName, raw, isStaff(user));
        } catch (RuntimeException e) {
            sent = false;
            message = "Account created. Email was not delivered. Copy the set-password link.";
            log.warn("Invite email failed for {}", user.getEmail(), e);
        }
        return new InviteUserResult(user.getId(), user.getEmail(), user.getRole().name(), sent, actionUrl, message);
    }

    public User updateRole(String actorId, String userId, String roleName) {
        rejectSelf(actorId, userId, "change your own role");
        User user = getUser(userId);
        rejectIfDeleting(user);
        User.Role next = parseAssignableRole(roleName);
        if (user.getRole() == User.Role.ADMIN && next != User.Role.ADMIN) {
            rejectLastAdmin(user, "demote");
        }
        user.setRole(next);
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
        if ("ADMIN".equalsIgnoreCase(roleName.trim())) {
            return User.Role.ADMIN;
        }
        throw new ApiException(ErrorCode.VALIDATION_ERROR, "Assign USER, EDITOR, or ADMIN", HttpStatus.BAD_REQUEST);
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
        if (user.getStatus() == User.Status.DELETING) {
            throw new ApiException(
                    ErrorCode.AUTH_ACCOUNT_DISABLED,
                    "This account is being deleted.",
                    HttpStatus.FORBIDDEN
            );
        }
        if (user.getStatus() == User.Status.DISABLED) {
            throw new ApiException(
                    ErrorCode.AUTH_ACCOUNT_DISABLED,
                    "This account is disabled. Contact support if you think this is a mistake.",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    public void rejectIfDeleting(User user) {
        if (user.getStatus() == User.Status.DELETING) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "This account is being deleted", HttpStatus.BAD_REQUEST);
        }
    }

    public LoginResponse finishLogin(User user, String device) {
        rejectIfDisabled(user);
        if (user.isTotpEnabled()) {
            return LoginResponse.totpChallenge(totpChallenges.create(user.getId(), device));
        }
        return issueTokens(user, device);
    }

    public LoginResponse verifyTotpLogin(String challenge, String code) {
        TotpChallengeStore.Entry entry = totpChallenges.peek(challenge);
        if (entry == null) {
            throw new ApiException(ErrorCode.AUTH_TOTP_INVALID, "This code expired. Sign in again.", HttpStatus.UNAUTHORIZED);
        }
        User user = requireUser(entry.userId());
        if (!user.isTotpEnabled() || !totpService.verify(user.getTotpSecret(), code)) {
            throw new ApiException(ErrorCode.AUTH_TOTP_INVALID, "That authenticator code is not valid", HttpStatus.UNAUTHORIZED);
        }
        totpChallenges.consume(challenge);
        return issueTokens(user, entry.device());
    }

    public TotpSetupResponse setupTotp(String userId) {
        User user = requireUser(userId);
        requireStaff(user);
        rejectIfDisabled(user);
        if (user.isTotpEnabled()) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Disable two-factor authentication first", HttpStatus.BAD_REQUEST);
        }
        String secret = totpService.newSecret();
        user.setTotpSecret(secret);
        user.setUpdatedAt(Instant.now());
        users.save(user);
        return new TotpSetupResponse(secret, totpService.otpauthUrl(user.getEmail(), secret));
    }

    public void enableTotp(String userId, String code) {
        User user = requireUser(userId);
        requireStaff(user);
        rejectIfDisabled(user);
        if (user.getTotpSecret() == null || user.getTotpSecret().isBlank()) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Start two-factor setup first", HttpStatus.BAD_REQUEST);
        }
        if (!totpService.verify(user.getTotpSecret(), code)) {
            throw new ApiException(ErrorCode.AUTH_TOTP_INVALID, "That authenticator code is not valid", HttpStatus.BAD_REQUEST);
        }
        user.setTotpEnabled(true);
        user.setUpdatedAt(Instant.now());
        users.save(user);
    }

    public void disableTotp(String userId, String password, String code) {
        User user = requireUser(userId);
        rejectIfDisabled(user);
        if (!user.isTotpEnabled()) {
            return;
        }
        boolean ok = totpService.verify(user.getTotpSecret(), code);
        if (!ok && user.getPasswordHash() != null && password != null && !password.isBlank()) {
            ok = passwordEncoder.matches(password, user.getPasswordHash());
        }
        if (!ok) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Confirm with your password or authenticator code", HttpStatus.UNAUTHORIZED);
        }
        user.setTotpEnabled(false);
        user.setTotpSecret(null);
        user.setUpdatedAt(Instant.now());
        users.save(user);
    }

    public void changePassword(String userId, String currentPassword, String newPassword) {
        User user = requireUser(userId);
        rejectIfDisabled(user);
        boolean hasHash = user.getPasswordHash() != null && !user.getPasswordHash().isBlank();
        if (hasHash) {
            if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
                throw new ApiException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Current password is incorrect", HttpStatus.UNAUTHORIZED);
            }
        }
        if (newPassword == null || newPassword.length() < 8) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Use at least 8 characters", HttpStatus.BAD_REQUEST);
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(Instant.now());
        users.save(user);
        refreshTokens.deleteByUserId(user.getId());
        sessionBan.block(user.getId());
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

    public boolean isStaff(User user) {
        return user != null && (user.getRole() == User.Role.ADMIN || user.getRole() == User.Role.EDITOR);
    }

    public void requireStaffConsole(User user) {
        if (!isStaff(user)) {
            throw new ApiException(
                    ErrorCode.AUTH_STAFF_REQUIRED,
                    "This console is for admin and editor accounts.",
                    HttpStatus.FORBIDDEN
            );
        }
    }

    private void requireStaff(User user) {
        if (!isStaff(user)) {
            throw new ApiException(ErrorCode.AUTH_STAFF_REQUIRED, "Two-factor is available on staff accounts only", HttpStatus.FORBIDDEN);
        }
    }

    private void rejectSelf(String actorId, String userId, String action) {
        if (actorId != null && !actorId.isBlank() && actorId.equals(userId)) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "You cannot " + action, HttpStatus.BAD_REQUEST);
        }
    }

    private void rejectLastAdmin(User user, String action) {
        if (user.getRole() == User.Role.ADMIN
                && user.getStatus() == User.Status.ACTIVE
                && users.countByRoleAndStatus(User.Role.ADMIN, User.Status.ACTIVE) <= 1) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Cannot " + action + " the last active admin", HttpStatus.BAD_REQUEST);
        }
    }
}
