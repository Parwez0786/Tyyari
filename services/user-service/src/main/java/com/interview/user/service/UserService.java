package com.interview.user.service;

import com.interview.user.dto.GoalsRequest;
import com.interview.user.dto.PreferencesRequest;
import com.interview.user.dto.ProfileRequest;
import com.interview.user.dto.UserDirectoryEntry;
import com.interview.user.exception.ApiException;
import com.interview.user.exception.ErrorCode;
import com.interview.user.model.Goals;
import com.interview.user.model.Preferences;
import com.interview.user.model.Profile;
import com.interview.user.model.Submission;
import com.interview.user.repository.GoalsRepository;
import com.interview.user.repository.PreferencesRepository;
import com.interview.user.repository.ProfileRepository;
import com.interview.user.repository.SubmissionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class UserService {
    private final ProfileRepository profiles;
    private final PreferencesRepository preferences;
    private final GoalsRepository goals;
    private final SubmissionRepository submissions;
    private final AvatarService avatars;

    public UserService(
            ProfileRepository profiles,
            PreferencesRepository preferences,
            GoalsRepository goals,
            SubmissionRepository submissions,
            AvatarService avatars
    ) {
        this.profiles = profiles;
        this.preferences = preferences;
        this.goals = goals;
        this.submissions = submissions;
        this.avatars = avatars;
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
        if (req.bio() != null) profile.setBio(req.bio());
        if (req.githubUrl() != null) profile.setGithubUrl(normalizeProfileLink(req.githubUrl(), "GitHub", "github.com"));
        if (req.linkedinUrl() != null) profile.setLinkedinUrl(normalizeProfileLink(req.linkedinUrl(), "LinkedIn", "linkedin.com"));
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
                    profile.getAvatar(),
                    profile.isOnboarded(),
                    lastSubmit.get(profile.getUserId())
            ));
        }
        for (Map.Entry<String, Instant> entry : lastSubmit.entrySet()) {
            if (seen.contains(entry.getKey())) {
                continue;
            }
            rows.add(new UserDirectoryEntry(entry.getKey(), null, null, false, entry.getValue()));
        }
        return rows;
    }

    public void deleteAccount(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        avatars.deleteFile(userId);
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

    private String normalizeProfileLink(String raw, String kind, String host) {
        String value = raw.trim();
        if (value.isEmpty()) {
            return "";
        }
        if (value.length() > 300) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, kind + " link is too long", HttpStatus.BAD_REQUEST);
        }
        if (!value.contains("://")) {
            if ("github.com".equals(host)) {
                value = value.toLowerCase(Locale.ROOT).startsWith("github.com/")
                        ? "https://" + value
                        : "https://github.com/" + value.replaceFirst("^@", "");
            } else if (value.toLowerCase(Locale.ROOT).startsWith("linkedin.com")
                    || value.toLowerCase(Locale.ROOT).startsWith("www.linkedin.com")) {
                value = "https://" + value;
            } else if (value.toLowerCase(Locale.ROOT).startsWith("in/")) {
                value = "https://www.linkedin.com/" + value;
            } else {
                value = "https://www.linkedin.com/in/" + value.replaceFirst("^@", "");
            }
        }
        URI uri;
        try {
            uri = URI.create(value);
        } catch (IllegalArgumentException e) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Enter a valid " + kind + " URL", HttpStatus.BAD_REQUEST);
        }
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!scheme.equals("https") && !scheme.equals("http")) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Enter a valid " + kind + " URL", HttpStatus.BAD_REQUEST);
        }
        String actual = uri.getHost();
        if (actual == null) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Enter a valid " + kind + " URL", HttpStatus.BAD_REQUEST);
        }
        actual = actual.toLowerCase(Locale.ROOT);
        if (actual.startsWith("www.")) {
            actual = actual.substring(4);
        }
        if (!actual.equals(host)) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, kind + " must be a " + host + " link", HttpStatus.BAD_REQUEST);
        }
        return uri.toString();
    }
}
