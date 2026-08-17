package com.interview.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Service
public class JwtService {
    private final SecretKey key;
    private final String issuer;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.issuer}") String issuer
    ) {
        this.key = Keys.hmacShaKeyFor(padSecret(secret).getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(issuer)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private static String padSecret(String secret) {
        if (secret.length() >= 32) {
            return secret;
        }
        return secret + "0".repeat(32 - secret.length());
    }
}
