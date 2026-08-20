package com.interview.user.dto;

import java.time.Instant;
import java.util.List;

public record PracticeProgress(
        int completed,
        List<String> questionIds,
        List<TypeCount> byType,
        int oaCompleted,
        Instant lastSubmittedAt,
        int streakDays,
        int todayCompleted,
        int weekCompleted,
        String lastQuestionId,
        String lastQuestionType,
        String lastView,
        List<Boolean> weekActive
) {
    public record TypeCount(
            String type,
            int completed
    ) {}
}
