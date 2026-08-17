package com.interview.user.dto;

public record PreferencesRequest(
        String preferredLanguage,
        String theme,
        Boolean emailNotifications,
        String difficultyPreference
) {}
