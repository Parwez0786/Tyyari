package com.interview.auth.dto;

public record PublicConfigResponse(
        boolean googleEnabled,
        String googleClientId,
        boolean githubEnabled,
        String githubClientId
) {}
