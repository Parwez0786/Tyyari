package com.interview.content.event;

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
public class ContentEventPublisher {
    private static final Logger log = LoggerFactory.getLogger(ContentEventPublisher.class);

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final String topic;

    public ContentEventPublisher(
            KafkaTemplate<String, String> kafkaTemplate,
            ObjectMapper objectMapper,
            @Value("${app.kafka.content-events-topic}") String topic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
        this.topic = topic;
    }

    public void publish(String eventType, String entityId, Map<String, Object> data) {
        try {
            Map<String, Object> event = Map.of(
                    "eventId", UUID.randomUUID().toString(),
                    "eventType", eventType,
                    "userId", data.getOrDefault("actorId", ""),
                    "timestamp", Instant.now().toString(),
                    "data", data
            );
            kafkaTemplate.send(topic, entityId, objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            log.warn("Failed to publish {}", eventType, e);
        }
    }
}
