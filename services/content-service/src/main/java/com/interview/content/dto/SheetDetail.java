package com.interview.content.dto;

import java.util.List;

public record SheetDetail(
        String id,
        String slug,
        String title,
        String description,
        String type,
        String difficulty,
        List<String> companies,
        List<QuestionListItem> questions
) {}
