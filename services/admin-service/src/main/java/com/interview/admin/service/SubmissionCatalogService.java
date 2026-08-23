package com.interview.admin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.interview.admin.client.DownstreamClient;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

@Service
public class SubmissionCatalogService {

    private final DownstreamClient downstream;
    private final ObjectMapper mapper;

    public SubmissionCatalogService(DownstreamClient downstream, ObjectMapper mapper) {
        this.downstream = downstream;
        this.mapper = mapper;
    }

    public ResponseEntity<String> enrich(ResponseEntity<String> raw, String actorId) {
        if (raw == null || !raw.getStatusCode().is2xxSuccessful() || raw.getBody() == null || raw.getBody().isBlank()) {
            return passthrough(raw);
        }
        try {
            JsonNode root = mapper.readTree(raw.getBody());
            JsonNode data = root.path("data");
            Set<String> questionIds = new LinkedHashSet<>();
            Set<String> setIds = new LinkedHashSet<>();
            collect(data, questionIds, setIds);
            if (questionIds.isEmpty() && setIds.isEmpty()) {
                return passthrough(raw);
            }
            Map<String, String> questions = Map.of();
            Map<String, String> sets = Map.of();
            Titles titles = lookup(questionIds, setIds, actorId);
            if (titles != null) {
                questions = titles.questions;
                sets = titles.sets;
            }
            apply(data, questions, sets);
            return ResponseEntity.status(raw.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(mapper.writeValueAsString(root));
        } catch (Exception ignored) {
            return passthrough(raw);
        }
    }

    private void collect(JsonNode node, Set<String> questionIds, Set<String> setIds) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return;
        }
        if (node.isArray()) {
            node.forEach(item -> collect(item, questionIds, setIds));
            return;
        }
        if (!node.isObject()) {
            return;
        }
        add(questionIds, node.path("questionId").asText(""));
        add(setIds, node.path("assessmentSetId").asText(""));
    }

    private void apply(JsonNode node, Map<String, String> questions, Map<String, String> sets) {
        if (node == null || node.isNull()) {
            return;
        }
        if (node.isArray()) {
            node.forEach(item -> apply(item, questions, sets));
            return;
        }
        if (!(node instanceof ObjectNode row)) {
            return;
        }
        String questionId = row.path("questionId").asText("");
        String setId = row.path("assessmentSetId").asText("");
        String questionTitle = questions.getOrDefault(questionId, "");
        String setTitle = sets.getOrDefault(setId, "");
        if (!questionTitle.isBlank()) {
            row.put("questionTitle", questionTitle);
        }
        if (!setTitle.isBlank()) {
            row.put("assessmentSetTitle", setTitle);
        }
    }

    private Titles lookup(Set<String> questionIds, Set<String> setIds, String actorId) {
        try {
            String body = mapper.writeValueAsString(Map.of(
                    "questionIds", questionIds,
                    "assessmentSetIds", setIds
            ));
            ResponseEntity<String> res = downstream.content("POST", "/internal/v1/catalog/titles", body, actorId);
            if (res == null || !res.getStatusCode().is2xxSuccessful() || res.getBody() == null) {
                return null;
            }
            JsonNode data = mapper.readTree(res.getBody()).path("data");
            return new Titles(asMap(data.path("questions")), asMap(data.path("assessmentSets")));
        } catch (Exception ignored) {
            return null;
        }
    }

    private static Map<String, String> asMap(JsonNode node) {
        java.util.LinkedHashMap<String, String> out = new java.util.LinkedHashMap<>();
        if (node == null || !node.isObject()) {
            return out;
        }
        node.fields().forEachRemaining(entry -> {
            String value = entry.getValue().asText("");
            if (!entry.getKey().isBlank() && !value.isBlank()) {
                out.put(entry.getKey(), value);
            }
        });
        return out;
    }

    private static void add(Set<String> ids, String value) {
        if (value != null && !value.isBlank()) {
            ids.add(value.trim());
        }
    }

    private static ResponseEntity<String> passthrough(ResponseEntity<String> raw) {
        if (raw == null) {
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body("{}");
        }
        return ResponseEntity.status(raw.getStatusCode())
                .contentType(MediaType.APPLICATION_JSON)
                .body(raw.getBody());
    }

    private record Titles(Map<String, String> questions, Map<String, String> sets) {}
}
