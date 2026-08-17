package com.interview.content.dto;

import java.util.List;

public record QuestionListItem(
        String id,
        String title,
        String slug,
        String type,
        String difficulty,
        String description,
        List<String> topics,
        List<String> companies,
        boolean isSolved,
        boolean premium
) {}
