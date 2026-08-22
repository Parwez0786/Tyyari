package com.interview.auth.dto;

public record InviteUserRequest(
        String email,
        String name,
        String role
) {}
