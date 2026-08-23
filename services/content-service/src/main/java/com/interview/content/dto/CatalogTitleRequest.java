package com.interview.content.dto;

import java.util.List;

public record CatalogTitleRequest(
        List<String> questionIds,
        List<String> assessmentSetIds
) {}
