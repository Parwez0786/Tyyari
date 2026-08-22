package com.interview.auth.dto;

public record SupportMailResult(
        boolean sent,
        String email,
        String actionUrl,
        String message
) {}
