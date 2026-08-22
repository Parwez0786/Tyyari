package com.interview.user.controller;

import com.interview.user.dto.AdminCandidateProfile;
import com.interview.user.dto.ApiResponse;
import com.interview.user.dto.PracticeMetrics;
import com.interview.user.dto.SubmissionListItem;
import com.interview.user.dto.SubmissionResponse;
import com.interview.user.dto.UserDirectoryEntry;
import com.interview.user.service.MetricsService;
import com.interview.user.service.SubmissionService;
import com.interview.user.service.UserService;
import com.interview.user.model.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/v1")
public class InternalMetricsController {

    private final MetricsService metrics;
    private final UserService userService;
    private final SubmissionService submissions;

    public InternalMetricsController(MetricsService metrics, UserService userService, SubmissionService submissions) {
        this.metrics = metrics;
        this.userService = userService;
        this.submissions = submissions;
    }

    @GetMapping("/metrics")
    public ApiResponse<PracticeMetrics> metrics() {
        return ApiResponse.ok(metrics.snapshot());
    }

    @GetMapping("/directory")
    public ApiResponse<List<UserDirectoryEntry>> directory() {
        return ApiResponse.ok(userService.directory());
    }

    @PostMapping("/users/{id}/defaults")
    public ApiResponse<Profile> defaults(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        Map<String, String> payload = body == null ? Map.of() : body;
        userService.createDefaults(id, payload.get("name"), payload.get("email"));
        return ApiResponse.ok(userService.getProfile(id));
    }

    @GetMapping("/users/{id}")
    public ApiResponse<AdminCandidateProfile> candidate(@PathVariable String id) {
        return ApiResponse.ok(new AdminCandidateProfile(
                userService.getProfile(id),
                userService.getGoals(id),
                userService.getPreferences(id),
                submissions.practiceProgress(id)
        ));
    }

    @GetMapping("/users/{id}/submissions")
    public ApiResponse<List<SubmissionListItem>> submissions(@PathVariable String id) {
        return ApiResponse.ok(submissions.listForUser(id));
    }

    @GetMapping("/users/{id}/submissions/{submissionId}")
    public ApiResponse<SubmissionResponse> submission(@PathVariable String id, @PathVariable String submissionId) {
        return ApiResponse.ok(submissions.getForUser(id, submissionId));
    }
}
