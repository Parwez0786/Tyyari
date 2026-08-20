package com.interview.content.dto;

import java.util.List;

public record SheetListItem(
        String id,
        String slug,
        String title,
        String description,
        String type,
        String difficulty,
        List<String> companies,
        int questionCount,
        List<String> questionIds
) {}
