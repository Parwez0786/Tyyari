package com.interview.auth.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Component
public class UserEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(UserEventPublisher.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String topic;

    public UserEventPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${app.kafka.user-events-topic}") String topic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.topic = topic;
    }

    public void publishRegistered(String userId, String email, String name) {
        try {
            Map<String, Object> event = Map.of(
                    "eventId", UUID.randomUUID().toString(),
                    "eventType", "USER_REGISTERED",
                    "userId", userId,
                    "timestamp", Instant.now().toString(),
                    "data", Map.of("email", email, "name", name)
            );
            kafkaTemplate.send(topic, userId, objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            log.warn("Failed to publish USER_REGISTERED for {}", userId, e);
        }
    }
}
