package com.interview.user.controller;

import com.interview.user.dto.ApiResponse;
import com.interview.user.dto.GoalsRequest;
import com.interview.user.dto.PreferencesRequest;
import com.interview.user.dto.PracticeProgress;
import com.interview.user.dto.ProfileRequest;
import com.interview.user.dto.SubmissionRequest;
import com.interview.user.dto.SubmissionResponse;
import com.interview.user.exception.ApiException;
import com.interview.user.exception.ErrorCode;
import com.interview.user.model.Goals;
import com.interview.user.model.Preferences;
import com.interview.user.model.Profile;
import com.interview.user.service.AvatarService;
import com.interview.user.service.SubmissionService;
import com.interview.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final SubmissionService submissionService;
    private final AvatarService avatarService;

    public UserController(UserService userService, SubmissionService submissionService, AvatarService avatarService) {
        this.userService = userService;
        this.submissionService = submissionService;
        this.avatarService = avatarService;
    }

    @GetMapping("/me")
    public ApiResponse<Profile> me(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ApiResponse.ok(userService.getProfile(requireUser(userId)));
    }

    @PutMapping("/me")
    public ApiResponse<Profile> update(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody ProfileRequest request
    ) {
        return ApiResponse.ok(userService.updateProfile(requireUser(userId), request));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Profile> uploadAvatar(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam("file") MultipartFile file
    ) {
        return ApiResponse.ok(avatarService.save(requireUser(userId), file), "Photo saved");
    }

    @DeleteMapping("/me/avatar")
    public ApiResponse<Profile> deleteAvatar(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ApiResponse.ok(avatarService.clear(requireUser(userId)), "Photo removed");
    }

    @GetMapping("/me/preferences")
    public ApiResponse<Preferences> prefs(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ApiResponse.ok(userService.getPreferences(requireUser(userId)));
    }

    @PutMapping("/me/preferences")
    public ApiResponse<Preferences> updatePrefs(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody PreferencesRequest request
    ) {
        return ApiResponse.ok(userService.updatePreferences(requireUser(userId), request));
    }

    @GetMapping("/me/goals")
    public ApiResponse<Goals> goals(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ApiResponse.ok(userService.getGoals(requireUser(userId)));
    }

    @PostMapping("/me/goals")
    public ApiResponse<Goals> createGoals(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody GoalsRequest request
    ) {
        return ApiResponse.ok(userService.saveGoals(requireUser(userId), request), "Goals saved");
    }

    @PutMapping("/me/goals")
    public ApiResponse<Goals> updateGoals(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody GoalsRequest request
    ) {
        return ApiResponse.ok(userService.saveGoals(requireUser(userId), request));
    }

    @PutMapping("/me/submissions")
    public ApiResponse<SubmissionResponse> saveSubmission(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody SubmissionRequest request
    ) {
        return ApiResponse.ok(submissionService.upsert(requireUser(userId), request), "Submission saved");
    }

    @GetMapping("/me/submissions")
    public ApiResponse<SubmissionResponse> getSubmission(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestParam String questionId,
            @RequestParam(required = false) String assessmentSetId
    ) {
        return ApiResponse.ok(submissionService.get(requireUser(userId), questionId, assessmentSetId));
    }

    @GetMapping("/me/assessments/{assessmentSetId}/submissions")
    public ApiResponse<List<SubmissionResponse>> assessmentSubmissions(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String assessmentSetId
    ) {
        return ApiResponse.ok(submissionService.listForAssessment(requireUser(userId), assessmentSetId));
    }

    @GetMapping("/me/progress")
    public ApiResponse<PracticeProgress> practiceProgress(
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return ApiResponse.ok(submissionService.practiceProgress(requireUser(userId)));
    }

    private String requireUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Missing user", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
