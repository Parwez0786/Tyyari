package com.interview.auth.dto;

public record TotpSetupResponse(String secret, String otpauthUrl) {}
