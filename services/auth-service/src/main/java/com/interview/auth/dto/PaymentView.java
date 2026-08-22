package com.interview.auth.dto;

import java.time.Instant;

public record PaymentView(
        String id,
        String userId,
        String email,
        String provider,
        String providerRef,
        String status,
        String stripeStatus,
        String paymentStatus,
        String paymentIntentId,
        long amount,
        String currency,
        String displayAmount,
        Instant createdAt,
        Instant updatedAt,
        Instant refundedAt,
        String refundId
) {}
