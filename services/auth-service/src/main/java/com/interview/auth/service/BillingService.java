package com.interview.auth.service;

import com.interview.auth.dto.BillingStatusResponse;
import com.interview.auth.dto.CheckoutResponse;
import com.interview.auth.dto.LoginResponse;
import com.interview.auth.dto.PaymentView;
import com.interview.auth.dto.PremiumWriteRequest;
import com.interview.auth.exception.ApiException;
import com.interview.auth.exception.ErrorCode;
import com.interview.auth.model.Payment;
import com.interview.auth.model.User;
import com.interview.auth.repository.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Refund;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class BillingService {
    private static final Logger log = LoggerFactory.getLogger(BillingService.class);

    private final AuthService authService;
    private final PaymentRepository payments;
    private final String frontendUrl;
    private final String stripeSecret;
    private final String webhookSecret;
    private final String currency;
    private final long amount;
    private final String productName;

    public BillingService(
            AuthService authService,
            PaymentRepository payments,
            @Value("${app.frontend-url}") String frontendUrl,
            @Value("${app.billing.stripe-secret-key}") String stripeSecret,
            @Value("${app.billing.stripe-webhook-secret}") String webhookSecret,
            @Value("${app.billing.currency}") String currency,
            @Value("${app.billing.amount}") long amount,
            @Value("${app.billing.product-name}") String productName
    ) {
        this.authService = authService;
        this.payments = payments;
        this.frontendUrl = frontendUrl;
        this.stripeSecret = stripeSecret == null ? "" : stripeSecret.trim();
        this.webhookSecret = webhookSecret == null ? "" : webhookSecret.trim();
        this.currency = currency == null ? "inr" : currency.toLowerCase(Locale.ROOT);
        this.amount = amount;
        this.productName = productName;
        if (stripeEnabled()) {
            Stripe.apiKey = this.stripeSecret;
        }
    }

    public boolean stripeEnabled() {
        return StringUtils.hasText(stripeSecret);
    }

    public BillingStatusResponse publicConfig() {
        return new BillingStatusResponse(false, provider(), productName, amount, currency, displayPrice());
    }

    public BillingStatusResponse status(String userId) {
        User user = authService.requireUser(userId);
        return new BillingStatusResponse(authService.isPremium(user), provider(), productName, amount, currency, displayPrice());
    }

    public CheckoutResponse checkout(String userId) {
        User user = authService.requireUser(userId);
        if (authService.isPremium(user)) {
            throw new ApiException(ErrorCode.ALREADY_PREMIUM, "You already have Premium", HttpStatus.CONFLICT);
        }
        if (!stripeEnabled()) {
            return new CheckoutResponse(frontendUrl + "/premium?status=dev", "dev");
        }
        try {
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(frontendUrl + "/premium?status=success&session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(frontendUrl + "/premium?status=cancel")
                    .setClientReferenceId(userId)
                    .putMetadata("userId", userId)
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(SessionCreateParams.LineItem.PriceData.builder()
                                    .setCurrency(currency)
                                    .setUnitAmount(amount)
                                    .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                            .setName(productName)
                                            .setDescription("Lifetime access to premium Tyyari questions")
                                            .build())
                                    .build())
                            .build())
                    .build();
            Session session = Session.create(params);
            Instant now = Instant.now();
            payments.save(Payment.builder()
                    .userId(userId)
                    .provider("stripe")
                    .providerRef(session.getId())
                    .status("open")
                    .stripeStatus(session.getStatus())
                    .paymentIntentId(session.getPaymentIntent())
                    .amount(amount)
                    .currency(currency)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
            return new CheckoutResponse(session.getUrl(), "stripe");
        } catch (StripeException e) {
            log.error("Stripe checkout failed for {}", userId, e);
            throw new ApiException(ErrorCode.BILLING_UNAVAILABLE, "Could not start checkout", HttpStatus.BAD_GATEWAY);
        }
    }

    public LoginResponse activateDev(String userId, String device) {
        if (stripeEnabled()) {
            throw new ApiException(ErrorCode.BILLING_UNAVAILABLE, "Use Stripe checkout", HttpStatus.BAD_REQUEST);
        }
        User user = fulfill(userId, "dev", "dev-" + userId);
        return authService.issueTokens(user, device);
    }

    public LoginResponse confirm(String userId, String sessionId, String device) {
        if (!stripeEnabled()) {
            throw new ApiException(ErrorCode.BILLING_UNAVAILABLE, "Stripe is not configured", HttpStatus.BAD_REQUEST);
        }
        try {
            Session session = Session.retrieve(sessionId);
            String owner = session.getClientReferenceId();
            if (owner == null || !owner.equals(userId)) {
                throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Session does not belong to you", HttpStatus.FORBIDDEN);
            }
            if (!"paid".equalsIgnoreCase(session.getPaymentStatus())) {
                throw new ApiException(ErrorCode.BILLING_NOT_PAID, "Payment is not complete", HttpStatus.PAYMENT_REQUIRED);
            }
            User user = fulfill(userId, "stripe", session.getId());
            return authService.issueTokens(user, device);
        } catch (ApiException e) {
            throw e;
        } catch (StripeException e) {
            log.error("Stripe confirm failed for {}", userId, e);
            throw new ApiException(ErrorCode.BILLING_UNAVAILABLE, "Could not confirm payment", HttpStatus.BAD_GATEWAY);
        }
    }

    public void handleWebhook(String payload, String signature) {
        if (!StringUtils.hasText(webhookSecret)) {
            throw new ApiException(ErrorCode.BILLING_UNAVAILABLE, "Webhook secret is not set", HttpStatus.BAD_REQUEST);
        }
        Event event;
        try {
            event = Webhook.constructEvent(payload, signature, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Invalid webhook signature", HttpStatus.UNAUTHORIZED);
        }
        if (!"checkout.session.completed".equals(event.getType())) {
            return;
        }
        StripeObject raw = event.getDataObjectDeserializer().getObject().orElse(null);
        if (!(raw instanceof Session session)) {
            return;
        }
        String userId = session.getClientReferenceId();
        if (!StringUtils.hasText(userId)) {
            return;
        }
        if (!"paid".equalsIgnoreCase(session.getPaymentStatus())) {
            return;
        }
        fulfill(userId, "stripe", session.getId());
    }

    public List<PaymentView> listPayments(String userId) {
        List<Payment> rows = StringUtils.hasText(userId)
                ? payments.findByUserIdOrderByCreatedAtDesc(userId)
                : payments.findAllByOrderByCreatedAtDesc();
        return rows.stream().map(this::toView).toList();
    }

    public PaymentView sessionStatus(String sessionId) {
        if (!StringUtils.hasText(sessionId)) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "sessionId is required", HttpStatus.BAD_REQUEST);
        }
        Payment existing = payments.findByProviderRef(sessionId.trim()).orElse(null);
        if (!stripeEnabled()) {
            if (existing == null) {
                throw new ApiException(ErrorCode.PAYMENT_NOT_FOUND, "Payment not found", HttpStatus.NOT_FOUND);
            }
            return toView(existing);
        }
        Session session = retrieveSession(sessionId.trim());
        if (existing != null) {
            applySession(existing, session);
            if (!"refunded".equalsIgnoreCase(existing.getStatus())) {
                if ("paid".equalsIgnoreCase(session.getPaymentStatus())) {
                    existing.setStatus("paid");
                    if (StringUtils.hasText(existing.getUserId())) {
                        authService.grantPremium(existing.getUserId());
                    }
                } else if ("expired".equalsIgnoreCase(session.getStatus())) {
                    existing.setStatus("expired");
                }
            }
            existing.setUpdatedAt(Instant.now());
            payments.save(existing);
            return toView(existing);
        }
        return fromSession(session);
    }

    public PaymentView refresh(String paymentId) {
        Payment payment = payments.findById(paymentId)
                .orElseThrow(() -> new ApiException(ErrorCode.PAYMENT_NOT_FOUND, "Payment not found", HttpStatus.NOT_FOUND));
        if (!"stripe".equalsIgnoreCase(payment.getProvider()) || !stripeEnabled()) {
            return toView(payment);
        }
        return sessionStatus(payment.getProviderRef());
    }

    public PaymentView refund(String paymentId) {
        Payment payment = payments.findById(paymentId)
                .orElseThrow(() -> new ApiException(ErrorCode.PAYMENT_NOT_FOUND, "Payment not found", HttpStatus.NOT_FOUND));
        if ("refunded".equalsIgnoreCase(payment.getStatus())) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR, "Payment is already refunded", HttpStatus.CONFLICT);
        }
        if (!"paid".equalsIgnoreCase(payment.getStatus()) && !"granted".equalsIgnoreCase(payment.getStatus())) {
            throw new ApiException(ErrorCode.BILLING_NOT_PAID, "Only paid or granted payments can be refunded", HttpStatus.BAD_REQUEST);
        }
        Instant now = Instant.now();
        if ("stripe".equalsIgnoreCase(payment.getProvider())) {
            if (!stripeEnabled()) {
                throw new ApiException(ErrorCode.BILLING_UNAVAILABLE, "Stripe is not configured", HttpStatus.BAD_REQUEST);
            }
            try {
                if (!StringUtils.hasText(payment.getPaymentIntentId())) {
                    Session session = retrieveSession(payment.getProviderRef());
                    applySession(payment, session);
                }
                if (!StringUtils.hasText(payment.getPaymentIntentId())) {
                    throw new ApiException(ErrorCode.BILLING_UNAVAILABLE, "Stripe payment intent is missing", HttpStatus.BAD_GATEWAY);
                }
                Refund refund = Refund.create(RefundCreateParams.builder()
                        .setPaymentIntent(payment.getPaymentIntentId())
                        .build());
                payment.setRefundId(refund.getId());
            } catch (ApiException e) {
                throw e;
            } catch (StripeException e) {
                log.error("Stripe refund failed for {}", paymentId, e);
                throw new ApiException(ErrorCode.BILLING_UNAVAILABLE, "Could not refund payment", HttpStatus.BAD_GATEWAY);
            }
        }
        payment.setStatus("refunded");
        payment.setRefundedAt(now);
        payment.setUpdatedAt(now);
        payments.save(payment);
        if (StringUtils.hasText(payment.getUserId())) {
            User user = authService.requireUser(payment.getUserId());
            if (user.getRole() != User.Role.ADMIN) {
                authService.revokePremium(payment.getUserId());
            }
        }
        return toView(payment);
    }

    public User setPremium(String userId, PremiumWriteRequest req) {
        boolean grant = req != null && Boolean.TRUE.equals(req.premium());
        if (!grant) {
            return authService.revokePremium(userId);
        }
        User before = authService.requireUser(userId);
        boolean wasPremium = authService.isPremium(before);
        User user = authService.grantPremium(userId, req.premiumUntil());
        if (!wasPremium && user.getRole() != User.Role.ADMIN) {
            Instant now = Instant.now();
            payments.save(Payment.builder()
                    .userId(userId)
                    .provider("admin")
                    .providerRef("grant-" + userId + "-" + now.toEpochMilli())
                    .status("granted")
                    .amount(0)
                    .currency(currency)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
        }
        return user;
    }

    private User fulfill(String userId, String provider, String providerRef) {
        Instant now = Instant.now();
        Payment payment = payments.findByProviderRef(providerRef).orElseGet(() -> Payment.builder()
                .userId(userId)
                .provider(provider)
                .providerRef(providerRef)
                .amount(amount)
                .currency(currency)
                .createdAt(now)
                .build());
        payment.setUserId(userId);
        payment.setProvider(provider);
        payment.setStatus("paid");
        if ("stripe".equals(provider)) {
            payment.setStripeStatus("complete");
        }
        payment.setUpdatedAt(now);
        payments.save(payment);
        return authService.grantPremium(userId);
    }

    private Session retrieveSession(String sessionId) {
        try {
            return Session.retrieve(sessionId);
        } catch (StripeException e) {
            log.error("Stripe session lookup failed for {}", sessionId, e);
            throw new ApiException(ErrorCode.PAYMENT_NOT_FOUND, "Stripe session not found", HttpStatus.NOT_FOUND);
        }
    }

    private void applySession(Payment payment, Session session) {
        payment.setStripeStatus(session.getStatus());
        if (StringUtils.hasText(session.getPaymentIntent())) {
            payment.setPaymentIntentId(session.getPaymentIntent());
        }
    }

    private PaymentView fromSession(Session session) {
        String userId = session.getClientReferenceId();
        String email = "";
        if (StringUtils.hasText(userId)) {
            try {
                email = authService.requireUser(userId).getEmail();
            } catch (ApiException ignored) {
                email = "";
            }
        }
        long sessionAmount = session.getAmountTotal() != null ? session.getAmountTotal() : amount;
        String sessionCurrency = StringUtils.hasText(session.getCurrency()) ? session.getCurrency() : currency;
        return new PaymentView(
                null,
                userId,
                email,
                "stripe",
                session.getId(),
                "paid".equalsIgnoreCase(session.getPaymentStatus()) ? "paid" : session.getStatus(),
                session.getStatus(),
                session.getPaymentStatus(),
                session.getPaymentIntent(),
                sessionAmount,
                sessionCurrency,
                formatAmount(sessionAmount, sessionCurrency),
                session.getCreated() != null ? Instant.ofEpochSecond(session.getCreated()) : Instant.now(),
                Instant.now(),
                null,
                null
        );
    }

    private PaymentView toView(Payment payment) {
        String email = "";
        if (StringUtils.hasText(payment.getUserId())) {
            try {
                email = authService.requireUser(payment.getUserId()).getEmail();
            } catch (ApiException ignored) {
                email = "";
            }
        }
        return new PaymentView(
                payment.getId(),
                payment.getUserId(),
                email,
                payment.getProvider(),
                payment.getProviderRef(),
                payment.getStatus(),
                payment.getStripeStatus(),
                "paid".equalsIgnoreCase(payment.getStatus()) ? "paid" : payment.getStatus(),
                payment.getPaymentIntentId(),
                payment.getAmount(),
                payment.getCurrency(),
                formatAmount(payment.getAmount(), payment.getCurrency()),
                payment.getCreatedAt(),
                payment.getUpdatedAt(),
                payment.getRefundedAt(),
                payment.getRefundId()
        );
    }

    private String formatAmount(long value, String cur) {
        String code = cur == null ? currency : cur.toLowerCase(Locale.ROOT);
        if ("inr".equals(code)) {
            return "₹" + (value / 100);
        }
        if ("usd".equals(code)) {
            return "$" + String.format(Locale.US, "%.2f", value / 100.0);
        }
        return value + " " + code.toUpperCase(Locale.ROOT);
    }

    private String provider() {
        return stripeEnabled() ? "stripe" : "dev";
    }

    private String displayPrice() {
        if ("inr".equals(currency)) {
            return "₹" + (amount / 100);
        }
        if ("usd".equals(currency)) {
            return "$" + String.format(Locale.US, "%.2f", amount / 100.0);
        }
        return amount + " " + currency.toUpperCase(Locale.ROOT);
    }
}
