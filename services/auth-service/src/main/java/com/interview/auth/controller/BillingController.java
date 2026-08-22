package com.interview.auth.controller;

import com.interview.auth.dto.ApiResponse;
import com.interview.auth.dto.BillingStatusResponse;
import com.interview.auth.dto.CheckoutResponse;
import com.interview.auth.dto.ConfirmCheckoutRequest;
import com.interview.auth.dto.LoginResponse;
import com.interview.auth.exception.ApiException;
import com.interview.auth.exception.ErrorCode;
import com.interview.auth.service.BillingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping("/public-config")
    public ApiResponse<BillingStatusResponse> publicConfig() {
        return ApiResponse.ok(billingService.publicConfig());
    }

    @GetMapping("/me")
    public ApiResponse<BillingStatusResponse> me(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ApiResponse.ok(billingService.status(requireUser(userId)));
    }

    @PostMapping("/checkout")
    public ApiResponse<CheckoutResponse> checkout(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ApiResponse.ok(billingService.checkout(requireUser(userId)));
    }

    @PostMapping("/dev-activate")
    public ApiResponse<LoginResponse> activateDev(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            HttpServletRequest request
    ) {
        return ApiResponse.ok(billingService.activateDev(requireUser(userId), device(request)), "Premium unlocked");
    }

    @PostMapping("/confirm")
    public ApiResponse<LoginResponse> confirm(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody ConfirmCheckoutRequest body,
            HttpServletRequest request
    ) {
        if (body == null || body.sessionId() == null || body.sessionId().isBlank()) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "sessionId is required", HttpStatus.BAD_REQUEST);
        }
        return ApiResponse.ok(billingService.confirm(requireUser(userId), body.sessionId(), device(request)), "Premium unlocked");
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestHeader(value = "Stripe-Signature", required = false) String signature,
            @RequestBody String payload
    ) {
        billingService.handleWebhook(payload, signature == null ? "" : signature);
        return ResponseEntity.ok().build();
    }

    private static String requireUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Missing user", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }

    private static String device(HttpServletRequest request) {
        String ua = request.getHeader("User-Agent");
        return ua == null ? "unknown" : ua.substring(0, Math.min(ua.length(), 120));
    }
}
