package com.interview.auth.service;

import com.interview.auth.event.UserEventPublisher;
import com.interview.auth.exception.ApiException;
import com.interview.auth.exception.ErrorCode;
import com.interview.auth.model.User;
import com.interview.auth.repository.EmailVerificationTokenRepository;
import com.interview.auth.repository.PasswordResetTokenRepository;
import com.interview.auth.repository.PaymentRepository;
import com.interview.auth.repository.RefreshTokenRepository;
import com.interview.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class AccountDeleteService {
    private static final Logger log = LoggerFactory.getLogger(AccountDeleteService.class);

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final EmailVerificationTokenRepository emailTokens;
    private final PasswordResetTokenRepository resetTokens;
    private final PaymentRepository payments;
    private final SessionBan sessionBan;
    private final UserEventPublisher events;

    public AccountDeleteService(
            UserRepository users,
            RefreshTokenRepository refreshTokens,
            EmailVerificationTokenRepository emailTokens,
            PasswordResetTokenRepository resetTokens,
            PaymentRepository payments,
            SessionBan sessionBan,
            UserEventPublisher events
    ) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.emailTokens = emailTokens;
        this.resetTokens = resetTokens;
        this.payments = payments;
        this.sessionBan = sessionBan;
        this.events = events;
    }

    public User requestDeletion(String userId) {
        User user = users.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND));
        if (user.getRole() == User.Role.ADMIN) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Cannot delete an admin account", HttpStatus.BAD_REQUEST);
        }
        if (user.getStatus() != User.Status.DELETING) {
            user.setStatus(User.Status.DELETING);
            user.setUpdatedAt(Instant.now());
            users.save(user);
            refreshTokens.deleteByUserId(user.getId());
            sessionBan.block(user.getId());
        }
        try {
            events.publishDeleteRequested(user.getId(), user.getEmail());
        } catch (RuntimeException e) {
            log.warn("Could not publish USER_DELETE_REQUESTED for {}", user.getId(), e);
            throw new ApiException(
                    ErrorCode.INTERNAL_SERVER_ERROR,
                    "Account locked, but the wipe did not queue. Click delete again to retry.",
                    HttpStatus.SERVICE_UNAVAILABLE
            );
        }
        return user;
    }

    public void purgeAuthRecords(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        refreshTokens.deleteByUserId(userId);
        emailTokens.deleteByUserId(userId);
        resetTokens.deleteByUserId(userId);
        payments.deleteByUserId(userId);
        sessionBan.block(userId);
        users.deleteById(userId);
        log.info("Purged auth records for {}", userId);
    }
}
