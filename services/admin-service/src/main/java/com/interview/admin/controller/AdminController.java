package com.interview.admin.controller;

import com.interview.admin.client.DownstreamClient;
import com.interview.admin.model.AuditLog;
import com.interview.admin.repository.AuditLogRepository;
import com.interview.admin.service.AuditService;
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

    public AdminController(DownstreamClient downstream, AuditService auditService, AuditLogRepository auditLogs) {
        this.downstream = downstream;
        this.auditService = auditService;
        this.auditLogs = auditLogs;
    }

    @GetMapping("/questions")
    public ResponseEntity<String> listQuestions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        String path = "/internal/v1/questions?page=" + page
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

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<String> userStatus(
            @PathVariable String id,
            @RequestBody String body,
            @RequestHeader(value = "X-User-Id", required = false) String userId
    ) {
        auditService.record(userId, "USER_STATUS", id);
        return json(downstream.auth("PATCH", "/internal/v1/users/" + id + "/status", body, userId));
    }

    @GetMapping("/stats")
    public ResponseEntity<String> stats(@RequestHeader(value = "X-User-Id", required = false) String userId) {
        return json(downstream.content("GET", "/internal/v1/stats", null, userId));
    }

    @GetMapping("/audit")
    public ResponseEntity<Map<String, Object>> audit() {
        return ResponseEntity.ok(Map.of("success", true, "data", auditLogs.findAll(), "message", "Success"));
    }

    private ResponseEntity<String> json(ResponseEntity<String> downstream) {
        return ResponseEntity.status(downstream.getStatusCode())
                .contentType(MediaType.APPLICATION_JSON)
                .body(downstream.getBody());
    }
}
