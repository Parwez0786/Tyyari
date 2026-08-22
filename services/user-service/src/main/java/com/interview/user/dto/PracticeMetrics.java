package com.interview.user.dto;

import java.util.List;
import java.util.Map;

public record PracticeMetrics(
        long submissions,
        long practiceSubmissions,
        long oaSubmissions,
        long uniqueSolvers,
        long activeLast7Days,
        Map<String, Long> byType,
        List<DayCount> submissionsByDay,
        long profiles,
        long onboarded,
        Map<String, Long> byTargetRole,
        Map<String, Long> byExperience,
        Double quizAvgPercent
) {
    public record DayCount(String date, long count) {}
}
