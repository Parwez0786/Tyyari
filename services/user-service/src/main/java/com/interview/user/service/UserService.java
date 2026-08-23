package com.interview.user.service;

import com.interview.user.dto.GoalsRequest;
import com.interview.user.dto.PreferencesRequest;
import com.interview.user.dto.ProfileRequest;
import com.interview.user.dto.UserDirectoryEntry;
import com.interview.user.model.Goals;
import com.interview.user.model.Preferences;
import com.interview.user.model.Profile;
import com.interview.user.model.Submission;
import com.interview.user.repository.GoalsRepository;
import com.interview.user.repository.PreferencesRepository;
import com.interview.user.repository.ProfileRepository;
import com.interview.user.repository.SubmissionRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class UserService {
    private final ProfileRepository profiles;
    private final PreferencesRepository preferences;
    private final GoalsRepository goals;
    private final SubmissionRepository submissions;

    public UserService(
            ProfileRepository profiles,
            PreferencesRepository preferences,
            GoalsRepository goals,
            SubmissionRepository submissions
    ) {
        this.profiles = profiles;
        this.preferences = preferences;
        this.goals = goals;
        this.submissions = submissions;
    }

    public void createDefaults(String userId, String name, String email) {
        if (profiles.findByUserId(userId).isPresent()) {
            return;
        }
        Instant now = Instant.now();
        profiles.save(Profile.builder()
                .userId(userId)
                .name(name == null || name.isBlank() ? email : name)
                .bio("")
                .skills(List.of())
                .onboarded(false)
                .createdAt(now)
                .updatedAt(now)
                .build());
        preferences.save(Preferences.builder()
                .userId(userId)
                .preferredLanguage("JAVA")
                .theme("light")
                .emailNotifications(true)
                .difficultyPreference("MEDIUM")
                .build());
        goals.save(Goals.builder()
                .userId(userId)
                .targetCompanies(List.of())
                .dailyGoalMinutes(60)
                .build());
    }

    public Profile getProfile(String userId) {
        return getOrCreateProfile(userId);
    }

    public Profile updateProfile(String userId, ProfileRequest req) {
        Profile profile = getOrCreateProfile(userId);
        if (req.name() != null) profile.setName(req.name());
        if (req.avatar() != null) profile.setAvatar(req.avatar());
        if (req.bio() != null) profile.setBio(req.bio());
        if (req.experience() != null) profile.setExperience(req.experience());
        if (req.currentRole() != null) profile.setCurrentRole(req.currentRole());
        if (req.targetRole() != null) profile.setTargetRole(req.targetRole());
        if (req.skills() != null) profile.setSkills(req.skills());
        if (req.onboarded() != null) profile.setOnboarded(req.onboarded());
        profile.setUpdatedAt(Instant.now());
        return profiles.save(profile);
    }

    public Preferences getPreferences(String userId) {
        return preferences.findByUserId(userId).orElseGet(() -> preferences.save(Preferences.builder()
                .userId(userId)
                .preferredLanguage("JAVA")
                .theme("light")
                .emailNotifications(true)
                .difficultyPreference("MEDIUM")
                .build()));
    }

    public Preferences updatePreferences(String userId, PreferencesRequest req) {
        Preferences prefs = getPreferences(userId);
        if (req.preferredLanguage() != null) prefs.setPreferredLanguage(req.preferredLanguage());
        if (req.theme() != null) prefs.setTheme(req.theme());
        if (req.emailNotifications() != null) prefs.setEmailNotifications(req.emailNotifications());
        if (req.difficultyPreference() != null) prefs.setDifficultyPreference(req.difficultyPreference());
        return preferences.save(prefs);
    }

    public Goals getGoals(String userId) {
        return goals.findByUserId(userId).orElseGet(() -> goals.save(Goals.builder()
                .userId(userId)
                .targetCompanies(List.of())
                .dailyGoalMinutes(60)
                .build()));
    }

    public List<UserDirectoryEntry> directory() {
        Map<String, Instant> lastSubmit = new HashMap<>();
        for (Submission submission : submissions.findAll()) {
            if (submission.getUserId() == null || submission.getSubmittedAt() == null) {
                continue;
            }
            lastSubmit.merge(submission.getUserId(), submission.getSubmittedAt(),
                    (a, b) -> a.isAfter(b) ? a : b);
        }
        List<UserDirectoryEntry> rows = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (Profile profile : profiles.findAll()) {
            seen.add(profile.getUserId());
            rows.add(new UserDirectoryEntry(
                    profile.getUserId(),
                    profile.getName(),
                    profile.isOnboarded(),
                    lastSubmit.get(profile.getUserId())
            ));
        }
        for (Map.Entry<String, Instant> entry : lastSubmit.entrySet()) {
            if (seen.contains(entry.getKey())) {
                continue;
            }
            rows.add(new UserDirectoryEntry(entry.getKey(), null, false, entry.getValue()));
        }
        return rows;
    }

    public void deleteAccount(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        submissions.deleteByUserId(userId);
        profiles.deleteByUserId(userId);
        preferences.deleteByUserId(userId);
        goals.deleteByUserId(userId);
    }

    public Goals saveGoals(String userId, GoalsRequest req) {
        Goals current = goals.findByUserId(userId).orElse(Goals.builder().userId(userId).build());
        if (req.targetCompanies() != null) current.setTargetCompanies(req.targetCompanies());
        if (req.targetRole() != null) current.setTargetRole(req.targetRole());
        if (req.targetDate() != null) current.setTargetDate(req.targetDate());
        if (req.dailyGoalMinutes() != null) current.setDailyGoalMinutes(req.dailyGoalMinutes());
        return goals.save(current);
    }

    private Profile getOrCreateProfile(String userId) {
        return profiles.findByUserId(userId).orElseGet(() -> {
            Instant now = Instant.now();
            return profiles.save(Profile.builder()
                    .userId(userId)
                    .name("Candidate")
                    .skills(List.of())
                    .onboarded(false)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
        });
    }
}
