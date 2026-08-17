package com.interview.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GitHubLoginRequest(@NotBlank String code, String redirectUri) {}
