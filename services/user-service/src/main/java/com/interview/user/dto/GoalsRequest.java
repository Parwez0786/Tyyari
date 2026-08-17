package com.interview.user.dto;

import java.time.LocalDate;
import java.util.List;

public record GoalsRequest(
        List<String> targetCompanies,
        String targetRole,
        LocalDate targetDate,
        Integer dailyGoalMinutes
) {}
