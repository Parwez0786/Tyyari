package com.interview.content.dto;

import java.util.List;

public record AssessmentSetDetail(
        String id,
        String slug,
        String title,
        String description,
        int durationMinutes,
        String difficulty,
        List<String> companies,
        List<QuestionListItem> questions,
        boolean cameraRequired
) {}
