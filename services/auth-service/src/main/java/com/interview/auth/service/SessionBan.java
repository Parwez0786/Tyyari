package com.interview.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class SessionBan {
    public static final String KEY_PREFIX = "session:block:";

    private final StringRedisTemplate redis;
    private final long ttlSeconds;

    public SessionBan(
            StringRedisTemplate redis,
            @Value("${jwt.access-token-seconds}") long ttlSeconds
    ) {
        this.redis = redis;
        this.ttlSeconds = Math.max(60, ttlSeconds);
    }

    public void block(String userId) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        redis.opsForValue().set(KEY_PREFIX + userId, "1", Duration.ofSeconds(ttlSeconds));
    }

    public void clear(String userId) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        redis.delete(KEY_PREFIX + userId);
    }
}
