package com.interview.user.controller;

import com.interview.user.dto.ApiResponse;
import com.interview.user.dto.GoalsRequest;
import com.interview.user.dto.PreferencesRequest;
import com.interview.user.dto.ProfileRequest;
import com.interview.user.exception.ApiException;
import com.interview.user.exception.ErrorCode;
import com.interview.user.model.Goals;
import com.interview.user.model.Preferences;
import com.interview.user.model.Profile;
import com.interview.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
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

    private String requireUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Missing user", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
