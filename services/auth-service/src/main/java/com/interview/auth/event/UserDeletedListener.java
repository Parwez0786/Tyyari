package com.interview.auth.event;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.auth.service.AccountDeleteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class UserDeletedListener {
    private static final Logger log = LoggerFactory.getLogger(UserDeletedListener.class);

    private final ObjectMapper objectMapper;
    private final AccountDeleteService accountDeleteService;

    public UserDeletedListener(ObjectMapper objectMapper, AccountDeleteService accountDeleteService) {
        this.objectMapper = objectMapper;
        this.accountDeleteService = accountDeleteService;
    }

    @KafkaListener(topics = "${app.kafka.user-events-topic}", groupId = "auth-service")
    public void onMessage(String payload) {
        JsonNode event;
        try {
            event = objectMapper.readTree(payload);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid user event payload", e);
        }
        if (!"USER_DELETE_REQUESTED".equals(event.path("eventType").asText())) {
            return;
        }
        String userId = event.path("userId").asText("");
        if (userId.isBlank()) {
            throw new IllegalArgumentException("USER_DELETE_REQUESTED missing userId");
        }
        accountDeleteService.purgeAuthRecords(userId);
        log.info("Auth purge complete for {}", userId);
    }
}
