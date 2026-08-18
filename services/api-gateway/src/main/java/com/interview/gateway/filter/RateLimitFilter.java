package com.interview.gateway.filter;

import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Component
public class RateLimitFilter implements WebFilter, Ordered {

    private final ReactiveStringRedisTemplate redis;

    public RateLimitFilter(ReactiveStringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }
        String path = exchange.getRequest().getURI().getPath();
        if (path.startsWith("/actuator")) {
            return chain.filter(exchange);
        }
        String role = (String) exchange.getAttributes().getOrDefault("role", "ANON");
        String userId = (String) exchange.getAttributes().get("userId");
        String ip = exchange.getRequest().getRemoteAddress() == null
                ? "unknown"
                : exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        String id = userId != null ? userId : ip;
        int limit = switch (role) {
            case "ADMIN" -> 1000;
            case "USER", "EDITOR" -> 1000;
            default -> 200;
        };
        String key = "rate_limit:" + id;
        return redis.opsForValue().increment(key)
                .flatMap(count -> {
                    Mono<Boolean> expire = count == 1 ? redis.expire(key, Duration.ofMinutes(1)) : Mono.just(true);
                    return expire.then(Mono.defer(() -> {
                        if (count > limit) {
                            CorsSupport.apply(exchange.getRequest(), exchange.getResponse());
                            exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
                            byte[] body = "{\"success\":false,\"error\":{\"code\":\"RATE_LIMIT_EXCEEDED\",\"message\":\"Too many requests\"}}"
                                    .getBytes(StandardCharsets.UTF_8);
                            return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(body)));
                        }
                        return chain.filter(exchange);
                    }));
                });
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
