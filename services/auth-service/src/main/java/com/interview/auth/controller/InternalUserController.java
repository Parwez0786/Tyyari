package com.interview.auth.controller;

import com.interview.auth.dto.ApiResponse;
import com.interview.auth.model.User;
import com.interview.auth.service.AuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/v1/users")
public class InternalUserController {

    private final AuthService authService;

    public InternalUserController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping
    public ApiResponse<List<User>> list() {
        return ApiResponse.ok(authService.listUsers());
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<User> status(@PathVariable String id, @RequestBody Map<String, String> body) {
        User.Status status = User.Status.valueOf(body.getOrDefault("status", "ACTIVE"));
        return ApiResponse.ok(authService.updateStatus(id, status));
    }
}
