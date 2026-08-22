package com.interview.auth.controller;

import com.interview.auth.dto.ApiResponse;
import com.interview.auth.dto.PaymentView;
import com.interview.auth.dto.PremiumWriteRequest;
import com.interview.auth.model.User;
import com.interview.auth.service.BillingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/internal/v1")
public class InternalBillingController {

    private final BillingService billingService;

    public InternalBillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping("/payments")
    public ApiResponse<List<PaymentView>> payments(@RequestParam(required = false) String userId) {
        return ApiResponse.ok(billingService.listPayments(userId));
    }

    @GetMapping("/billing/sessions/{sessionId}")
    public ApiResponse<PaymentView> session(@PathVariable String sessionId) {
        return ApiResponse.ok(billingService.sessionStatus(sessionId));
    }

    @PostMapping("/payments/{id}/refresh")
    public ApiResponse<PaymentView> refresh(@PathVariable String id) {
        return ApiResponse.ok(billingService.refresh(id));
    }

    @PostMapping("/payments/{id}/refund")
    public ApiResponse<PaymentView> refund(@PathVariable String id) {
        return ApiResponse.ok(billingService.refund(id), "Refunded");
    }

    @PatchMapping("/users/{id}/premium")
    public ApiResponse<User> premium(@PathVariable String id, @RequestBody PremiumWriteRequest request) {
        return ApiResponse.ok(billingService.setPremium(id, request));
    }
}
