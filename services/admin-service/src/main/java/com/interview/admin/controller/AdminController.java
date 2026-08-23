package com.interview.admin.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.admin.client.DownstreamClient;
import com.interview.admin.model.AuditLog;
import com.interview.admin.repository.AuditLogRepository;
import com.interview.admin.service.AuditService;
import com.interview.admin.service.SubmissionCatalogService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final DownstreamClient downstream;
    private final AuditService auditService;
    private final AuditLogRepository auditLogs;
    private final ObjectMapper mapper;
    private final SubmissionCatalogService catalogTitles;

    public AdminController(
            DownstreamClient downstream,
            AuditService auditService,
            AuditLogRepository auditLogs,
            ObjectMapper mapper,
            SubmissionCatalogService catalogTitles
    ) {
        this.downstream = downstream;
        this.auditService = auditService;
        this.auditLogs = auditLogs;
        this.mapper = mapper;
        this.catalogTitles = catalogTitles;
    }

    @GetMapping("/questions")
    public ResponseEntity<String> listQuestions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int limit,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        String path = "/internal/v1/questions?page=" + page
                + "&limit=" + limit
                + (type != null ? "&type=" + type : "")
                + (search != null ? "&search=" + search : "");
        return json(downstream.content("GET", path, null, userId));
    }

    @GetMapping("/questions/{id}")
    public ResponseEntity<String> getQuestion(@PathVariable String id, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("GET", "/internal/v1/questions/" + id, null, userId));
    }

    @PostMapping("/questions")
    public ResponseEntity<String> createQuestion(
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "QUESTION_CREATE", "create question");
        return json(downstream.content("POST", "/internal/v1/questions", body, userId));
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<String> updateQuestion(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "QUESTION_UPDATE", id);
        return json(downstream.content("PUT", "/internal/v1/questions/" + id, body, userId));
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<String> deleteQuestion(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "QUESTION_DELETE", id);
        return json(downstream.content("DELETE", "/internal/v1/questions/" + id, null, userId));
    }

    @PatchMapping("/questions/{id}/publish")
    public ResponseEntity<String> publish(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "QUESTION_PUBLISH", id);
        return json(downstream.content("PATCH", "/internal/v1/questions/" + id + "/publish", body, userId));
    }

    @PostMapping("/companies")
    public ResponseEntity<String> createCompany(@RequestBody String body, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        auditService.record(userId, "COMPANY_CREATE", "company");
        return json(downstream.content("POST", "/internal/v1/companies", body, userId));
    }

    @PutMapping("/companies/{id}")
    public ResponseEntity<String> updateCompany(@PathVariable String id, @RequestBody String body, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("PUT", "/internal/v1/companies/" + id, body, userId));
    }

    @DeleteMapping("/companies/{id}")
    public ResponseEntity<String> deleteCompany(@PathVariable String id, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("DELETE", "/internal/v1/companies/" + id, null, userId));
    }

    @GetMapping("/companies")
    public ResponseEntity<String> companies(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("GET", "/internal/v1/companies", null, userId));
    }

    @PostMapping("/topics")
    public ResponseEntity<String> createTopic(@RequestBody String body, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("POST", "/internal/v1/topics", body, userId));
    }

    @PutMapping("/topics/{id}")
    public ResponseEntity<String> updateTopic(@PathVariable String id, @RequestBody String body, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("PUT", "/internal/v1/topics/" + id, body, userId));
    }

    @DeleteMapping("/topics/{id}")
    public ResponseEntity<String> deleteTopic(@PathVariable String id, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("DELETE", "/internal/v1/topics/" + id, null, userId));
    }

    @GetMapping("/topics")
    public ResponseEntity<String> topics(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("GET", "/internal/v1/topics", null, userId));
    }

    @PostMapping("/tags")
    public ResponseEntity<String> createTag(@RequestBody String body, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("POST", "/internal/v1/tags", body, userId));
    }

    @PutMapping("/tags/{id}")
    public ResponseEntity<String> updateTag(@PathVariable String id, @RequestBody String body, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("PUT", "/internal/v1/tags/" + id, body, userId));
    }

    @DeleteMapping("/tags/{id}")
    public ResponseEntity<String> deleteTag(@PathVariable String id, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("DELETE", "/internal/v1/tags/" + id, null, userId));
    }

    @GetMapping("/tags")
    public ResponseEntity<String> tags(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("GET", "/internal/v1/tags", null, userId));
    }

    @GetMapping("/users")
    public ResponseEntity<String> users(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.auth("GET", "/internal/v1/users", null, userId));
    }

    @GetMapping("/users/directory")
    public ResponseEntity<String> userDirectory(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.users("GET", "/internal/v1/directory", null, userId));
    }

    @PostMapping("/users")
    public ResponseEntity<String> inviteUser(
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "USER_INVITE", "invite user");
        ResponseEntity<String> created = downstream.auth("POST", "/internal/v1/users", body, userId);
        seedInvitedProfile(created, body, userId);
        return json(created);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<String> user(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return json(downstream.auth("GET", "/internal/v1/users/" + id, null, userId));
    }

    @GetMapping("/users/{id}/profile")
    public ResponseEntity<String> userProfile(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return json(downstream.users("GET", "/internal/v1/users/" + id, null, userId));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<String> userStatus(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "USER_STATUS", id);
        return json(downstream.auth("PATCH", "/internal/v1/users/" + id + "/status", body, userId));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<String> userRole(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "USER_ROLE", id);
        return json(downstream.auth("PATCH", "/internal/v1/users/" + id + "/role", body, userId));
    }

    @PatchMapping("/users/{id}/premium")
    public ResponseEntity<String> userPremium(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        String compact = body == null ? "" : body.replaceAll("\\s+", "");
        boolean grant = compact.contains("\"premium\":true");
        auditService.record(userId, grant ? "PREMIUM_GRANT" : "PREMIUM_REVOKE", id);
        return json(downstream.auth("PATCH", "/internal/v1/users/" + id + "/premium", body, userId));
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<String> resetPassword(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "USER_RESET_PASSWORD", id);
        return json(downstream.auth("POST", "/internal/v1/users/" + id + "/reset-password", "{}", userId));
    }

    @PostMapping("/users/{id}/resend-verification")
    public ResponseEntity<String> resendVerification(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "USER_RESEND_VERIFY", id);
        return json(downstream.auth("POST", "/internal/v1/users/" + id + "/resend-verification", "{}", userId));
    }

    @PatchMapping("/users/{id}/email")
    public ResponseEntity<String> changeEmail(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "USER_CHANGE_EMAIL", id);
        return json(downstream.auth("PATCH", "/internal/v1/users/" + id + "/email", body, userId));
    }

    @PatchMapping("/users/{id}/verify")
    public ResponseEntity<String> forceVerify(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "USER_FORCE_VERIFY", id);
        return json(downstream.auth("PATCH", "/internal/v1/users/" + id + "/verify", "{}", userId));
    }

    @PostMapping("/users/{id}/revoke-sessions")
    public ResponseEntity<String> revokeSessions(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "USER_REVOKE_SESSIONS", id);
        return json(downstream.auth("POST", "/internal/v1/users/" + id + "/revoke-sessions", "{}", userId));
    }

    @PostMapping("/users/{id}/delete")
    public ResponseEntity<String> deleteUser(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "USER_DELETE", id);
        return json(downstream.auth("POST", "/internal/v1/users/" + id + "/delete", "{}", userId));
    }

    @GetMapping("/users/{id}/submissions")
    public ResponseEntity<String> userSubmissions(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return catalogTitles.enrich(downstream.users("GET", "/internal/v1/users/" + id + "/submissions", null, userId), userId);
    }

    @GetMapping("/users/{id}/submissions/{submissionId}")
    public ResponseEntity<String> userSubmission(
            @PathVariable String id,
            @PathVariable String submissionId,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return catalogTitles.enrich(downstream.users("GET", "/internal/v1/users/" + id + "/submissions/" + submissionId, null, userId), userId);
    }

    @GetMapping("/payments")
    public ResponseEntity<String> payments(
            @RequestParam(required = false) String userId,
            @RequestHeader(value = "X-User-Id", required = false) String actorId
    ) {
        String path = "/internal/v1/payments" + (userId != null && !userId.isBlank() ? "?userId=" + userId : "");
        return json(downstream.auth("GET", path, null, actorId));
    }

    @GetMapping("/billing/sessions/{sessionId}")
    public ResponseEntity<String> billingSession(
            @PathVariable String sessionId,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return json(downstream.auth("GET", "/internal/v1/billing/sessions/" + sessionId, null, userId));
    }

    @PostMapping("/payments/{id}/refresh")
    public ResponseEntity<String> refreshPayment(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return json(downstream.auth("POST", "/internal/v1/payments/" + id + "/refresh", "{}", userId));
    }

    @PostMapping("/payments/{id}/refund")
    public ResponseEntity<String> refundPayment(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "PAYMENT_REFUND", id);
        return json(downstream.auth("POST", "/internal/v1/payments/" + id + "/refund", "{}", userId));
    }

    @GetMapping("/sheets")
    public ResponseEntity<String> sheets(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("GET", "/internal/v1/sheets", null, userId));
    }

    @GetMapping("/sheets/{id}")
    public ResponseEntity<String> sheet(@PathVariable String id, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("GET", "/internal/v1/sheets/" + id, null, userId));
    }

    @PostMapping("/sheets")
    public ResponseEntity<String> createSheet(@RequestBody String body, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        auditService.record(userId, "SHEET_CREATE", "create sheet");
        return json(downstream.content("POST", "/internal/v1/sheets", body, userId));
    }

    @PutMapping("/sheets/{id}")
    public ResponseEntity<String> updateSheet(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "SHEET_UPDATE", id);
        return json(downstream.content("PUT", "/internal/v1/sheets/" + id, body, userId));
    }

    @DeleteMapping("/sheets/{id}")
    public ResponseEntity<String> deleteSheet(@PathVariable String id, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        auditService.record(userId, "SHEET_DELETE", id);
        return json(downstream.content("DELETE", "/internal/v1/sheets/" + id, null, userId));
    }

    @PatchMapping("/sheets/{id}/publish")
    public ResponseEntity<String> publishSheet(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "SHEET_PUBLISH", id);
        return json(downstream.content("PATCH", "/internal/v1/sheets/" + id + "/publish", body, userId));
    }

    @GetMapping("/assessment-sets")
    public ResponseEntity<String> assessmentSets(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("GET", "/internal/v1/assessment-sets", null, userId));
    }

    @GetMapping("/assessment-sets/{id}")
    public ResponseEntity<String> assessmentSet(@PathVariable String id, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("GET", "/internal/v1/assessment-sets/" + id, null, userId));
    }

    @PostMapping("/assessment-sets")
    public ResponseEntity<String> createAssessment(@RequestBody String body, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        auditService.record(userId, "OA_CREATE", "create assessment");
        return json(downstream.content("POST", "/internal/v1/assessment-sets", body, userId));
    }

    @PutMapping("/assessment-sets/{id}")
    public ResponseEntity<String> updateAssessment(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "OA_UPDATE", id);
        return json(downstream.content("PUT", "/internal/v1/assessment-sets/" + id, body, userId));
    }

    @DeleteMapping("/assessment-sets/{id}")
    public ResponseEntity<String> deleteAssessment(@PathVariable String id, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        auditService.record(userId, "OA_DELETE", id);
        return json(downstream.content("DELETE", "/internal/v1/assessment-sets/" + id, null, userId));
    }

    @PatchMapping("/assessment-sets/{id}/publish")
    public ResponseEntity<String> publishAssessment(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "OA_PUBLISH", id);
        return json(downstream.content("PATCH", "/internal/v1/assessment-sets/" + id + "/publish", body, userId));
    }

    @GetMapping("/stats")
    public ResponseEntity<String> stats(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("GET", "/internal/v1/stats", null, userId));
    }

    @GetMapping("/metrics")
    public ResponseEntity<String> metrics(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.users("GET", "/internal/v1/metrics", null, userId));
    }

    @GetMapping("/audit")
    public ResponseEntity<Map<String, Object>> audit() {
        return ResponseEntity.ok(Map.of("success", true, "data", auditLogs.findAllByOrderByCreatedAtDesc(), "message", "Success"));
    }

    private void seedInvitedProfile(ResponseEntity<String> created, String body, String actorId) {
        if (created == null || !created.getStatusCode().is2xxSuccessful() || created.getBody() == null) {
            return;
        }
        try {
            JsonNode invite = mapper.readTree(created.getBody()).path("data");
            String id = invite.path("id").asText("");
            if (id.isBlank()) {
                return;
            }
            JsonNode request = mapper.readTree(body == null || body.isBlank() ? "{}" : body);
            String seed = mapper.createObjectNode()
                    .put("name", request.path("name").asText(""))
                    .put("email", invite.path("email").asText(""))
                    .toString();
            downstream.users("POST", "/internal/v1/users/" + id + "/defaults", seed, actorId);
        } catch (Exception ignored) {
            // Profile still arrives via USER_REGISTERED if Kafka is up.
        }
    }

    private ResponseEntity<String> json(ResponseEntity<String> downstream) {
        return ResponseEntity.status(downstream.getStatusCode())
                .contentType(MediaType.APPLICATION_JSON)
                .body(downstream.getBody());
    }
}
