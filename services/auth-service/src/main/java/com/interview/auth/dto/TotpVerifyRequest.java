package com.interview.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record TotpVerifyRequest(@NotBlank String challenge, @NotBlank String code) {}
