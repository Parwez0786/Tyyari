package com.interview.auth.repository;

import com.interview.auth.model.PasswordResetToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends MongoRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByTokenHashAndUsedFalse(String tokenHash);
}
