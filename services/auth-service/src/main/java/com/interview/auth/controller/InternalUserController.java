package com.interview.auth.controller;

import com.interview.auth.dto.ApiResponse;
import com.interview.auth.dto.InviteUserRequest;
import com.interview.auth.dto.InviteUserResult;
import com.interview.auth.dto.SupportMailResult;
import com.interview.auth.model.User;
import com.interview.auth.service.AccountDeleteService;
import com.interview.auth.service.AuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/v1/users")
public class InternalUserController {

    private final AuthService authService;
    private final AccountDeleteService accountDeleteService;

    public InternalUserController(AuthService authService, AccountDeleteService accountDeleteService) {
        this.authService = authService;
        this.accountDeleteService = accountDeleteService;
    }

    @GetMapping
    public ApiResponse<List<User>> list() {
        return ApiResponse.ok(authService.listUsers());
    }

    @PostMapping
    public ApiResponse<InviteUserResult> invite(@RequestBody InviteUserRequest body) {
        return ApiResponse.ok(authService.inviteUser(
                body == null ? null : body.email(),
                body == null ? null : body.name(),
                body == null ? null : body.role()
        ));
    }

    @GetMapping("/{id}")
    public ApiResponse<User> get(@PathVariable String id) {
        return ApiResponse.ok(authService.getUser(id));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<User> status(@PathVariable String id, @RequestBody Map<String, String> body) {
        User.Status status = User.Status.valueOf(body.getOrDefault("status", "ACTIVE"));
        return ApiResponse.ok(authService.updateStatus(id, status));
    }

    @PatchMapping("/{id}/role")
    public ApiResponse<User> role(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ApiResponse.ok(authService.updateRole(id, body.get("role")));
    }

    @PostMapping("/{id}/reset-password")
    public ApiResponse<SupportMailResult> resetPassword(@PathVariable String id) {
        return ApiResponse.ok(authService.sendPasswordResetForUser(id));
    }

    @PostMapping("/{id}/resend-verification")
    public ApiResponse<SupportMailResult> resendVerification(@PathVariable String id) {
        return ApiResponse.ok(authService.resendVerificationForUser(id));
    }

    @PatchMapping("/{id}/verify")
    public ApiResponse<User> verify(@PathVariable String id) {
        return ApiResponse.ok(authService.forceVerifyEmail(id));
    }

    @PostMapping("/{id}/revoke-sessions")
    public ApiResponse<Void> revokeSessions(@PathVariable String id) {
        authService.revokeSessions(id);
        return ApiResponse.ok(null, "Sessions revoked");
    }

    @PostMapping("/{id}/delete")
    public ApiResponse<User> delete(@PathVariable String id) {
        return ApiResponse.ok(
                accountDeleteService.requestDeletion(id),
                "Deletion queued. They are signed out. Profile and submissions wipe in the background."
        );
    }
}
