package com.interview.content.dto;

import java.util.List;

public record SheetWriteRequest(
        String title,
        String slug,
        String description,
        String type,
        String difficulty,
        List<String> companies,
        List<String> questionSlugs,
        Boolean published
) {}
