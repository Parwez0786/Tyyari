package com.interview.gateway.filter;

import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;

final class CorsSupport {
    private CorsSupport() {}

    static void apply(ServerHttpRequest request, ServerHttpResponse response) {
        String origin = request.getHeaders().getOrigin();
        if (origin == null || origin.isBlank()) {
            return;
        }
        if (!allowed(origin)) {
            return;
        }
        HttpHeaders headers = response.getHeaders();
        if (!headers.containsKey(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN)) {
            headers.set(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin);
            headers.set(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
            headers.add(HttpHeaders.VARY, "Origin");
        }
    }

    private static boolean allowed(String origin) {
        return origin.startsWith("http://localhost:")
                || origin.startsWith("http://127.0.0.1:");
    }
}
