package com.interview.auth.dto;

public record InviteUserResult(
        String id,
        String email,
        String role,
        boolean sent,
        String actionUrl,
        String message
) {}
