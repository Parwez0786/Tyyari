package com.interview.user.service;

import com.interview.user.dto.PracticeMetrics;
import com.interview.user.model.Goals;
import com.interview.user.model.Profile;
import com.interview.user.model.Submission;
import com.interview.user.repository.GoalsRepository;
import com.interview.user.repository.ProfileRepository;
import com.interview.user.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MetricsService {
    private static final List<String> TYPES = List.of("DSA", "HLD", "LLD", "CS", "FRONTEND", "OA");

    private final SubmissionRepository submissions;
    private final ProfileRepository profiles;
    private final GoalsRepository goals;

    public MetricsService(SubmissionRepository submissions, ProfileRepository profiles, GoalsRepository goals) {
        this.submissions = submissions;
        this.profiles = profiles;
        this.goals = goals;
    }

    public PracticeMetrics snapshot() {
        List<Submission> all = submissions.findAll();
        List<Profile> profileList = profiles.findAll();
        List<Goals> goalList = goals.findAll();

        long practice = all.stream().filter(s -> Submission.SCOPE_PRACTICE.equals(s.getScope())).count();
        long oa = all.stream().filter(s -> Submission.SCOPE_OA.equals(s.getScope())).count();
        Set<String> solvers = all.stream().map(Submission::getUserId).filter(StringUtils::hasText).collect(Collectors.toSet());

        Instant weekAgo = Instant.now().minusSeconds(7L * 24 * 60 * 60);
        long active = all.stream()
                .filter(s -> s.getSubmittedAt() != null && s.getSubmittedAt().isAfter(weekAgo))
                .map(Submission::getUserId)
                .filter(StringUtils::hasText)
                .collect(Collectors.toSet())
                .size();

        Map<String, Long> byType = new LinkedHashMap<>();
        for (String type : TYPES) {
            byType.put(type, 0L);
        }
        for (Submission submission : all) {
            String type = submission.getQuestionType() == null ? "UNKNOWN" : submission.getQuestionType().toUpperCase();
            byType.put(type, byType.getOrDefault(type, 0L) + 1);
        }

        List<PracticeMetrics.DayCount> byDay = lastDays(14);
        Map<String, Long> dayCounts = byDay.stream().collect(Collectors.toMap(PracticeMetrics.DayCount::date, d -> 0L, (a, b) -> a, LinkedHashMap::new));
        for (Submission submission : all) {
            if (submission.getSubmittedAt() == null) continue;
            String key = submission.getSubmittedAt().atZone(ZoneOffset.UTC).toLocalDate().toString();
            if (dayCounts.containsKey(key)) {
                dayCounts.put(key, dayCounts.get(key) + 1);
            }
        }
        List<PracticeMetrics.DayCount> submissionsByDay = dayCounts.entrySet().stream()
                .map(e -> new PracticeMetrics.DayCount(e.getKey(), e.getValue()))
                .toList();

        long onboarded = profileList.stream().filter(Profile::isOnboarded).count();
        Map<String, Long> byRole = new LinkedHashMap<>();
        for (Profile profile : profileList) {
            String role = StringUtils.hasText(profile.getTargetRole()) ? profile.getTargetRole() : "Unset";
            byRole.put(role, byRole.getOrDefault(role, 0L) + 1);
        }
        for (Goals goal : goalList) {
            if (!StringUtils.hasText(goal.getTargetRole())) continue;
            if (profileList.stream().anyMatch(p -> p.getUserId().equals(goal.getUserId()) && StringUtils.hasText(p.getTargetRole()))) {
                continue;
            }
            byRole.put(goal.getTargetRole(), byRole.getOrDefault(goal.getTargetRole(), 0L) + 1);
        }

        Map<String, Long> byExperience = new LinkedHashMap<>();
        for (Profile profile : profileList) {
            String exp = StringUtils.hasText(profile.getExperience()) ? profile.getExperience() : "Unset";
            byExperience.put(exp, byExperience.getOrDefault(exp, 0L) + 1);
        }

        List<Submission> quizzes = all.stream()
                .filter(s -> s.getQuizTotal() != null && s.getQuizTotal() > 0 && s.getQuizScore() != null)
                .toList();
        Double quizAvg = quizzes.isEmpty() ? null : quizzes.stream()
                .mapToDouble(s -> 100.0 * s.getQuizScore() / s.getQuizTotal())
                .average()
                .orElse(0);

        return new PracticeMetrics(
                all.size(),
                practice,
                oa,
                solvers.size(),
                active,
                byType,
                submissionsByDay,
                profileList.size(),
                onboarded,
                byRole,
                byExperience,
                quizAvg
        );
    }

    private static List<PracticeMetrics.DayCount> lastDays(int n) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<PracticeMetrics.DayCount> days = new ArrayList<>();
        for (int i = n - 1; i >= 0; i--) {
            days.add(new PracticeMetrics.DayCount(today.minusDays(i).toString(), 0));
        }
        return days;
    }
}
