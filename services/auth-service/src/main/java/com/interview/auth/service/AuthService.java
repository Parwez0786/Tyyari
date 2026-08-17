package com.interview.auth.service;

import com.interview.auth.dto.LoginResponse;
import com.interview.auth.dto.MeResponse;
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
    private final long refreshTokenDays;

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
            @Value("${jwt.refresh-token-days}") long refreshTokenDays
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
        this.refreshTokenDays = refreshTokenDays;
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
        if (user.getStatus() != User.Status.ACTIVE) {
            throw new ApiException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid credentials", HttpStatus.UNAUTHORIZED);
        }
        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new ApiException(ErrorCode.AUTH_USE_GOOGLE, "This account uses Google or GitHub sign-in", HttpStatus.UNAUTHORIZED);
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ApiException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Invalid credentials", HttpStatus.UNAUTHORIZED);
        }
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
        return new MeResponse(user.getId(), user.getEmail(), user.getRole().name());
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
    }

    public List<User> listUsers() {
        return users.findAll();
    }

    public User updateStatus(String userId, User.Status status) {
        User user = users.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
        user.setStatus(status);
        user.setUpdatedAt(Instant.now());
        return users.save(user);
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

    public LoginResponse issueTokens(User user, String device) {
        String access = jwtService.generateAccessToken(user.getId(), user.getRole().name());
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
