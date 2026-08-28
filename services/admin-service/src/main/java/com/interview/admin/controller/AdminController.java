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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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
        return audited(downstream.content("POST", "/internal/v1/questions", body, userId), userId, "QUESTION_CREATE", null);
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<String> updateQuestion(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.content("PUT", "/internal/v1/questions/" + id, body, userId), userId, "QUESTION_UPDATE", id);
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<String> deleteQuestion(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.content("DELETE", "/internal/v1/questions/" + id, null, userId), userId, "QUESTION_DELETE", id);
    }

    @PatchMapping("/questions/{id}/publish")
    public ResponseEntity<String> publish(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.content("PATCH", "/internal/v1/questions/" + id + "/publish", body, userId), userId, "QUESTION_PUBLISH", id);
    }

    @PostMapping("/companies")
    public ResponseEntity<String> createCompany(@RequestBody String body, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return audited(downstream.content("POST", "/internal/v1/companies", body, userId), userId, "COMPANY_CREATE", null);
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
        ResponseEntity<String> created = downstream.auth("POST", "/internal/v1/users", body, userId);
        seedInvitedProfile(created, body, userId);
        return audited(created, userId, "USER_INVITE", dataText(created, "id"));
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

    @PostMapping(value = "/users/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadUserAvatar(
            @PathVariable String id,
            @RequestPart("file") MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.usersFile("POST", "/internal/v1/users/" + id + "/avatar", file, userId), userId, "USER_AVATAR", id);
    }

    @DeleteMapping("/users/{id}/avatar")
    public ResponseEntity<String> deleteUserAvatar(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.users("DELETE", "/internal/v1/users/" + id + "/avatar", null, userId), userId, "USER_AVATAR_CLEAR", id);
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<String> userStatus(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.auth("PATCH", "/internal/v1/users/" + id + "/status", body, userId), userId, "USER_STATUS", id);
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<String> userRole(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.auth("PATCH", "/internal/v1/users/" + id + "/role", body, userId), userId, "USER_ROLE", id);
    }

    @PatchMapping("/users/{id}/premium")
    public ResponseEntity<String> userPremium(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        String compact = body == null ? "" : body.replaceAll("\\s+", "");
        boolean grant = compact.contains("\"premium\":true");
        return audited(
                downstream.auth("PATCH", "/internal/v1/users/" + id + "/premium", body, userId),
                userId,
                grant ? "PREMIUM_GRANT" : "PREMIUM_REVOKE",
                id
        );
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<String> resetPassword(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.auth("POST", "/internal/v1/users/" + id + "/reset-password", "{}", userId), userId, "USER_RESET_PASSWORD", id);
    }

    @PostMapping("/users/{id}/resend-verification")
    public ResponseEntity<String> resendVerification(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.auth("POST", "/internal/v1/users/" + id + "/resend-verification", "{}", userId), userId, "USER_RESEND_VERIFY", id);
    }

    @PatchMapping("/users/{id}/email")
    public ResponseEntity<String> changeEmail(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.auth("PATCH", "/internal/v1/users/" + id + "/email", body, userId), userId, "USER_CHANGE_EMAIL", id);
    }

    @PatchMapping("/users/{id}/verify")
    public ResponseEntity<String> forceVerify(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.auth("PATCH", "/internal/v1/users/" + id + "/verify", "{}", userId), userId, "USER_FORCE_VERIFY", id);
    }

    @PostMapping("/users/{id}/revoke-sessions")
    public ResponseEntity<String> revokeSessions(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.auth("POST", "/internal/v1/users/" + id + "/revoke-sessions", "{}", userId), userId, "USER_REVOKE_SESSIONS", id);
    }

    @PostMapping("/users/{id}/delete")
    public ResponseEntity<String> deleteUser(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.auth("POST", "/internal/v1/users/" + id + "/delete", "{}", userId), userId, "USER_DELETE", id);
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
        ResponseEntity<String> raw = downstream.auth("POST", "/internal/v1/payments/" + id + "/refund", "{}", userId);
        String target = dataText(raw, "userId");
        return audited(raw, userId, "PAYMENT_REFUND", target.isBlank() ? id : target);
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
        return audited(downstream.content("POST", "/internal/v1/sheets", body, userId), userId, "SHEET_CREATE", null);
    }

    @PutMapping("/sheets/{id}")
    public ResponseEntity<String> updateSheet(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.content("PUT", "/internal/v1/sheets/" + id, body, userId), userId, "SHEET_UPDATE", id);
    }

    @DeleteMapping("/sheets/{id}")
    public ResponseEntity<String> deleteSheet(@PathVariable String id, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return audited(downstream.content("DELETE", "/internal/v1/sheets/" + id, null, userId), userId, "SHEET_DELETE", id);
    }

    @PatchMapping("/sheets/{id}/publish")
    public ResponseEntity<String> publishSheet(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.content("PATCH", "/internal/v1/sheets/" + id + "/publish", body, userId), userId, "SHEET_PUBLISH", id);
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
        return audited(downstream.content("POST", "/internal/v1/assessment-sets", body, userId), userId, "OA_CREATE", null);
    }

    @PutMapping("/assessment-sets/{id}")
    public ResponseEntity<String> updateAssessment(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.content("PUT", "/internal/v1/assessment-sets/" + id, body, userId), userId, "OA_UPDATE", id);
    }

    @DeleteMapping("/assessment-sets/{id}")
    public ResponseEntity<String> deleteAssessment(@PathVariable String id, @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return audited(downstream.content("DELETE", "/internal/v1/assessment-sets/" + id, null, userId), userId, "OA_DELETE", id);
    }

    @PatchMapping("/assessment-sets/{id}/publish")
    public ResponseEntity<String> publishAssessment(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        return audited(downstream.content("PATCH", "/internal/v1/assessment-sets/" + id + "/publish", body, userId), userId, "OA_PUBLISH", id);
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

    private ResponseEntity<String> audited(ResponseEntity<String> downstream, String actorId, String action, String detail) {
        ResponseEntity<String> res = json(downstream);
        if (res.getStatusCode().is2xxSuccessful()) {
            String target = detail != null && !detail.isBlank() ? detail : dataText(downstream, "id");
            if (target == null || target.isBlank()) {
                target = action;
            }
            auditService.record(actorId, action, target);
        }
        return res;
    }

    private String dataText(ResponseEntity<String> downstream, String field) {
        try {
            String body = downstream == null ? null : downstream.getBody();
            if (body == null || body.isBlank()) {
                return "";
            }
            return mapper.readTree(body).path("data").path(field).asText("");
        } catch (Exception ignored) {
            return "";
        }
    }
}
