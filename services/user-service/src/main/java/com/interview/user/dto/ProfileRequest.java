package com.interview.user.dto;

import java.util.List;

public record ProfileRequest(
        String name,
        String avatar,
        String bio,
        String githubUrl,
        String linkedinUrl,
        String experience,
        String currentRole,
        String targetRole,
        List<String> skills,
        Boolean onboarded
) {}
