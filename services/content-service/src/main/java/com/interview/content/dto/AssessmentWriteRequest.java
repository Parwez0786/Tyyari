package com.interview.content.dto;

import java.util.List;

public record AssessmentWriteRequest(
        String title,
        String slug,
        String description,
        Integer durationMinutes,
        String difficulty,
        List<String> companies,
        List<String> questionSlugs,
        Boolean published
) {}
