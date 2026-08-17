package com.interview.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.admin.model.AuditLog;
import com.interview.admin.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class AuditService {
    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository logs;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper mapper;
    private final String topic;

    public AuditService(
            AuditLogRepository logs,
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper mapper,
            @Value("${app.kafka.audit-events-topic}") String topic
    ) {
        this.logs = logs;
        this.kafkaTemplate = kafkaTemplate;
        this.mapper = mapper;
        this.topic = topic;
    }

    public void record(String actorId, String action, String detail) {
        logs.save(AuditLog.builder()
                .actorId(actorId)
                .action(action)
                .detail(detail)
                .createdAt(Instant.now())
                .build());
        try {
            kafkaTemplate.send(topic, actorId, mapper.writeValueAsString(Map.of(
                    "eventId", UUID.randomUUID().toString(),
                    "eventType", action,
                    "userId", actorId == null ? "" : actorId,
                    "timestamp", Instant.now().toString(),
                    "data", Map.of("detail", detail == null ? "" : detail)
            )));
        } catch (Exception e) {
            log.warn("Failed to publish audit event", e);
        }
    }
}
