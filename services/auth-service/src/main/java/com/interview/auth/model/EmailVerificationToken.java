package com.interview.auth.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "email_verification_tokens")
public class EmailVerificationToken {
    @Id
    private String id;
    private String userId;
    private String tokenHash;
    private Instant expiresAt;
    private Instant createdAt;
}
