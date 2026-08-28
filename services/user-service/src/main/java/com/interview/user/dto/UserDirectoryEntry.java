package com.interview.user.dto;

import java.time.Instant;

public record UserDirectoryEntry(
        String userId,
        String name,
        String avatar,
        boolean onboarded,
        Instant lastSubmittedAt
) {}
