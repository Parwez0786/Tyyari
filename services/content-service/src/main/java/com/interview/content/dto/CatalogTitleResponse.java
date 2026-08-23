package com.interview.content.dto;

import java.util.Map;

public record CatalogTitleResponse(
        Map<String, String> questions,
        Map<String, String> assessmentSets
) {}
