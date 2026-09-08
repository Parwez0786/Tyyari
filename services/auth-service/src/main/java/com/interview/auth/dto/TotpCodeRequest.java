package com.interview.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record TotpCodeRequest(@NotBlank String code) {}
