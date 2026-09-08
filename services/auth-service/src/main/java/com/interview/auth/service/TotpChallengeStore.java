package com.interview.auth.service;

import com.interview.auth.security.TokenHasher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class TotpChallengeStore {
    private static final String PREFIX = "totp:login:";
    private static final Duration TTL = Duration.ofMinutes(5);

    private final StringRedisTemplate redis;
    private final TokenHasher tokenHasher;

    public TotpChallengeStore(StringRedisTemplate redis, TokenHasher tokenHasher) {
        this.redis = redis;
        this.tokenHasher = tokenHasher;
    }

    public String create(String userId, String device) {
        String raw = tokenHasher.randomToken();
        redis.opsForValue().set(PREFIX + raw, userId + "\n" + (device == null ? "" : device), TTL);
        return raw;
    }

    public Entry peek(String challenge) {
        if (challenge == null || challenge.isBlank()) {
            return null;
        }
        String raw = redis.opsForValue().get(PREFIX + challenge);
        if (raw == null) {
            return null;
        }
        int split = raw.indexOf('\n');
        if (split < 0) {
            return new Entry(raw, "");
        }
        return new Entry(raw.substring(0, split), raw.substring(split + 1));
    }

    public void consume(String challenge) {
        if (challenge != null && !challenge.isBlank()) {
            redis.delete(PREFIX + challenge);
        }
    }

    public record Entry(String userId, String device) {}
}
