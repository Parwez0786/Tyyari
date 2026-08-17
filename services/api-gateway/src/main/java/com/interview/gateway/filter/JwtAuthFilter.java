package com.interview.gateway.filter;

import com.interview.gateway.security.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthFilter implements WebFilter, Ordered {

    private static final List<String> PUBLIC_PREFIXES = List.of(
            "/actuator",
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/verify-email",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/api/v1/auth/resend-verification",
            "/api/v1/auth/google",
            "/api/v1/auth/github",
            "/api/v1/auth/public-config"
    );

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }
        String path = exchange.getRequest().getURI().getPath();
        if (isPublic(path)) {
            return chain.filter(exchange);
        }

        String header = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            return unauthorized(exchange, "AUTH_UNAUTHORIZED", "Missing bearer token");
        }
        try {
            Claims claims = jwtService.parse(header.substring(7));
            String userId = claims.getSubject();
            String role = claims.get("role", String.class);
            if (path.startsWith("/api/v1/admin") && !"ADMIN".equals(role)) {
                return unauthorized(exchange, "AUTH_UNAUTHORIZED", "Admin role required", HttpStatus.FORBIDDEN);
            }
            ServerHttpRequest mutated = exchange.getRequest().mutate()
                    .header("X-User-Id", userId)
                    .header("X-User-Role", role == null ? "USER" : role)
                    .build();
            exchange.getAttributes().put("userId", userId);
            exchange.getAttributes().put("role", role);
            return chain.filter(exchange.mutate().request(mutated).build());
        } catch (ExpiredJwtException e) {
            return unauthorized(exchange, "AUTH_TOKEN_EXPIRED", "Access token expired");
        } catch (JwtException e) {
            return unauthorized(exchange, "AUTH_UNAUTHORIZED", "Invalid token");
        }
    }

    private boolean isPublic(String path) {
        return PUBLIC_PREFIXES.stream().anyMatch(path::startsWith);
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String code, String message) {
        return unauthorized(exchange, code, message, HttpStatus.UNAUTHORIZED);
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String code, String message, HttpStatus status) {
        CorsSupport.apply(exchange.getRequest(), exchange.getResponse());
        exchange.getResponse().setStatusCode(status);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] body = ("{\"success\":false,\"error\":{\"code\":\"" + code + "\",\"message\":\"" + message + "\"}}")
                .getBytes(StandardCharsets.UTF_8);
        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(body)));
    }

    @Override
    public int getOrder() {
        return -2;
    }
}
