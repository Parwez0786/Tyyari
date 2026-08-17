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
        try {
            JsonNode event = objectMapper.readTree(payload);
            if (!"USER_REGISTERED".equals(event.path("eventType").asText())) {
                return;
            }
            String userId = event.path("userId").asText();
            JsonNode data = event.path("data");
            userService.createDefaults(userId, data.path("name").asText(null), data.path("email").asText(null));
            log.info("Created profile for {}", userId);
        } catch (Exception e) {
            log.error("Failed to consume user event", e);
        }
    }
}
