package com.interview.auth.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final String issuer;
    private final long accessTokenSeconds;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.issuer}") String issuer,
            @Value("${jwt.access-token-seconds}") long accessTokenSeconds
    ) {
        this.key = Keys.hmacShaKeyFor(padSecret(secret).getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
        this.accessTokenSeconds = accessTokenSeconds;
    }

    public String generateAccessToken(String userId, String role) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(issuer)
                .subject(userId)
                .claim("role", role)
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessTokenSeconds)))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getAccessTokenSeconds() {
        return accessTokenSeconds;
    }

    private static String padSecret(String secret) {
        if (secret.length() >= 32) {
            return secret;
        }
        return secret + "0".repeat(32 - secret.length());
    }
}
