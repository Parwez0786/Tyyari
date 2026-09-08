package com.interview.content.dto;

import java.time.Instant;

public record QuestionReviewRequest(
        String reviewStatus,
        String reviewer,
        String reviewNote,
        Instant scheduledPublishAt
) {}
