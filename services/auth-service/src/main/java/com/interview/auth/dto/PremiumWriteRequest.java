package com.interview.auth.dto;

import java.time.Instant;

public record PremiumWriteRequest(
        Boolean premium,
        Instant premiumUntil
) {}
