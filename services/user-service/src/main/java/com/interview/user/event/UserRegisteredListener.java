package com.interview.user.event;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.user.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class UserRegisteredListener {
    private static final Logger log = LoggerFactory.getLogger(UserRegisteredListener.class);

    private final ObjectMapper objectMapper;
    private final UserService userService;

    public UserRegisteredListener(ObjectMapper objectMapper, UserService userService) {
        this.objectMapper = objectMapper;
        this.userService = userService;
    }

    @KafkaListener(topics = "${app.kafka.user-events-topic}")
    public void onMessage(String payload) {
        JsonNode event;
        try {
            event = objectMapper.readTree(payload);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid user event payload", e);
        }
        String type = event.path("eventType").asText();
        String userId = event.path("userId").asText("");
        if ("USER_REGISTERED".equals(type)) {
            JsonNode data = event.path("data");
            userService.createDefaults(userId, data.path("name").asText(null), data.path("email").asText(null));
            log.info("Created profile for {}", userId);
            return;
        }
        if ("USER_DELETE_REQUESTED".equals(type)) {
            if (userId.isBlank()) {
                throw new IllegalArgumentException("USER_DELETE_REQUESTED missing userId");
            }
            userService.deleteAccount(userId);
            log.info("Purged profile, goals, prefs, and submissions for {}", userId);
        }
    }
}
