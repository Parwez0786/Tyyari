package com.interview.gateway.filter;

import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Optional;
import java.util.UUID;

@Component
public class CorrelationIdFilter implements WebFilter, Ordered {
    public static final String HEADER = "X-Correlation-ID";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String id = Optional.ofNullable(exchange.getRequest().getHeaders().getFirst(HEADER))
                .filter(s -> !s.isBlank())
                .orElse(UUID.randomUUID().toString());
        ServerHttpRequest request = exchange.getRequest().mutate().header(HEADER, id).build();
        exchange.getResponse().getHeaders().set(HEADER, id);
        return chain.filter(exchange.mutate().request(request).build());
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
