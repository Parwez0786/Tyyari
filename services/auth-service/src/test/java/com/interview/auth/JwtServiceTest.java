package com.interview.auth;

import com.interview.auth.security.JwtService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JwtServiceTest {

    @Test
    void roundTrip() {
        JwtService jwt = new JwtService("change-me-to-a-long-random-secret-at-least-32-chars", "interview-platform", 900);
        String token = jwt.generateAccessToken("user-1", "USER", true);
        assertEquals("user-1", jwt.parse(token).getSubject());
        assertEquals("USER", jwt.parse(token).get("role", String.class));
        assertEquals(Boolean.TRUE, jwt.parse(token).get("premium", Boolean.class));
    }
}
