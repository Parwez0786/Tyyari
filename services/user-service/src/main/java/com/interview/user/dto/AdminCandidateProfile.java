package com.interview.user.dto;

import com.interview.user.model.Goals;
import com.interview.user.model.Preferences;
import com.interview.user.model.Profile;

public record AdminCandidateProfile(
        Profile profile,
        Goals goals,
        Preferences preferences,
        PracticeProgress progress
) {}
