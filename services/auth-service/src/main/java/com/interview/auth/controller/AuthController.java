package com.interview.auth.controller;

import com.interview.auth.dto.ApiResponse;
import com.interview.auth.dto.ChangePasswordRequest;
import com.interview.auth.dto.ForgotPasswordRequest;
import com.interview.auth.dto.GitHubLoginRequest;
import com.interview.auth.dto.GoogleLoginRequest;
import com.interview.auth.dto.PublicConfigResponse;
import com.interview.auth.dto.LoginRequest;
import com.interview.auth.dto.LoginResponse;
import com.interview.auth.dto.LogoutRequest;
import com.interview.auth.dto.MeResponse;
import com.interview.auth.dto.RefreshRequest;
import com.interview.auth.dto.RegisterRequest;
import com.interview.auth.dto.RegisterResponse;
import com.interview.auth.dto.ResetPasswordRequest;
import com.interview.auth.dto.TokenRequest;
import com.interview.auth.dto.TotpCodeRequest;
import com.interview.auth.dto.TotpDisableRequest;
import com.interview.auth.dto.TotpSetupResponse;
import com.interview.auth.dto.TotpVerifyRequest;
import com.interview.auth.exception.ApiException;
import com.interview.auth.exception.ErrorCode;
import com.interview.auth.service.AuthService;
import com.interview.auth.service.GitHubAuthService;
import com.interview.auth.service.GoogleAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;
    private final GitHubAuthService gitHubAuthService;

    public AuthController(AuthService authService, GoogleAuthService googleAuthService, GitHubAuthService gitHubAuthService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
        this.gitHubAuthService = gitHubAuthService;
    }

    @PostMapping("/register")
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        String userId = authService.register(request.name(), request.email(), request.password());
        return ApiResponse.ok(new RegisterResponse(userId), "Check your email to verify your account");
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        return ApiResponse.ok(authService.login(
                request.email(),
                request.password(),
                device(http),
                Boolean.TRUE.equals(request.staffConsole())
        ));
    }

    @PostMapping("/google")
    public ApiResponse<LoginResponse> google(@Valid @RequestBody GoogleLoginRequest request, HttpServletRequest http) {
        return ApiResponse.ok(googleAuthService.login(
                request.idToken(),
                device(http),
                Boolean.TRUE.equals(request.staffConsole())
        ));
    }

    @PostMapping("/github")
    public ApiResponse<LoginResponse> github(@Valid @RequestBody GitHubLoginRequest request, HttpServletRequest http) {
        return ApiResponse.ok(gitHubAuthService.login(
                request.code(),
                request.redirectUri(),
                device(http),
                Boolean.TRUE.equals(request.staffConsole())
        ));
    }

    @GetMapping("/public-config")
    public ApiResponse<PublicConfigResponse> publicConfig() {
        return ApiResponse.ok(new PublicConfigResponse(
                googleAuthService.enabled(),
                googleAuthService.clientId(),
                gitHubAuthService.enabled(),
                gitHubAuthService.clientId()
        ));
    }

    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refresh(@Valid @RequestBody RefreshRequest request, HttpServletRequest http) {
        return ApiResponse.ok(authService.refresh(request.refreshToken(), device(http)));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request.refreshToken());
        return ApiResponse.ok(null, "Logged out");
    }

    @GetMapping("/me")
    public ApiResponse<MeResponse> me(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Missing user", HttpStatus.UNAUTHORIZED);
        }
        return ApiResponse.ok(authService.me(userId));
    }

    @PostMapping("/verify-email")
    public ApiResponse<Void> verify(@Valid @RequestBody TokenRequest request) {
        authService.verifyEmail(request.token());
        return ApiResponse.ok(null, "Email verified");
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgot(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ApiResponse.ok(null, "If that email exists, we sent a reset link");
    }

    @PostMapping("/resend-verification")
    public ApiResponse<Void> resend(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.resendVerification(request.email());
        return ApiResponse.ok(null, "If that email exists, we sent a verification email");
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> reset(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.password());
        return ApiResponse.ok(null, "Password updated");
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        requireUser(userId);
        authService.changePassword(userId, request.currentPassword(), request.newPassword());
        return ApiResponse.ok(null, "Password updated. Sign in again.");
    }

    @PostMapping("/totp/verify")
    public ApiResponse<LoginResponse> verifyTotp(@Valid @RequestBody TotpVerifyRequest request, HttpServletRequest http) {
        return ApiResponse.ok(authService.verifyTotpLogin(request.challenge(), request.code()));
    }

    @PostMapping("/totp/setup")
    public ApiResponse<TotpSetupResponse> setupTotp(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        requireUser(userId);
        return ApiResponse.ok(authService.setupTotp(userId));
    }

    @PostMapping("/totp/enable")
    public ApiResponse<Void> enableTotp(
            @Valid @RequestBody TotpCodeRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        requireUser(userId);
        authService.enableTotp(userId, request.code());
        return ApiResponse.ok(null, "Two-factor authentication is on");
    }

    @PostMapping("/totp/disable")
    public ApiResponse<Void> disableTotp(
            @RequestBody(required = false) TotpDisableRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        requireUser(userId);
        TotpDisableRequest body = request == null ? new TotpDisableRequest(null, null) : request;
        authService.disableTotp(userId, body.password(), body.code());
        return ApiResponse.ok(null, "Two-factor authentication is off");
    }

    private static void requireUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Missing user", HttpStatus.UNAUTHORIZED);
        }
    }

    private static String device(HttpServletRequest request) {
        String ua = request.getHeader("User-Agent");
        return ua == null ? "unknown" : ua.substring(0, Math.min(ua.length(), 120));
    }
}
