package com.interview.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginResponse(
        String accessToken,
        String refreshToken,
        Long expiresIn,
        Boolean requiresTotp,
        String totpChallenge
) {
    public LoginResponse(String accessToken, String refreshToken, long expiresIn) {
        this(accessToken, refreshToken, expiresIn, null, null);
    }

    public static LoginResponse totpChallenge(String challenge) {
        return new LoginResponse(null, null, null, true, challenge);
    }
}
