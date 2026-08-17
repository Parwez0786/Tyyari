package com.interview.user.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String id = Optional.ofNullable(request.getHeader("X-Correlation-ID")).filter(s -> !s.isBlank())
                .orElse(UUID.randomUUID().toString());
        MDC.put("correlationId", id);
        if (request.getHeader("X-User-Id") != null) {
            MDC.put("userId", request.getHeader("X-User-Id"));
        }
        response.setHeader("X-Correlation-ID", id);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }
}
