package com.interview.auth.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payments")
public class Payment {
    @Id
    private String id;
    @Indexed
    private String userId;
    private String provider;
    @Indexed(unique = true)
    private String providerRef;
    private String status;
    private String stripeStatus;
    private String paymentIntentId;
    private String refundId;
    private Instant refundedAt;
    private long amount;
    private String currency;
    private Instant createdAt;
    private Instant updatedAt;
}
