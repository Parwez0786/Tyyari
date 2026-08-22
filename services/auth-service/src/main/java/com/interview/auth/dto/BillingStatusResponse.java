package com.interview.auth.dto;

public record BillingStatusResponse(
        boolean premium,
        String provider,
        String productName,
        long amount,
        String currency,
        String displayPrice
) {}
