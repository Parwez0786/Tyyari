package com.interview.auth.repository;

import com.interview.auth.model.EmailVerificationToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface EmailVerificationTokenRepository extends MongoRepository<EmailVerificationToken, String> {
    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);
    void deleteByUserId(String userId);
}
