package com.interview.content.dto;

import java.util.List;

public record AssessmentSetListItem(
        String id,
        String slug,
        String title,
        String description,
        int durationMinutes,
        String difficulty,
        List<String> companies,
        int questionCount
) {}
