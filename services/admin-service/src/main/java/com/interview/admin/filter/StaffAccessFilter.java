package com.interview.admin.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class StaffAccessFilter extends OncePerRequestFilter {

    private static final List<String> ADMIN_ONLY = List.of(
            "/api/v1/admin/users",
            "/api/v1/admin/payments",
            "/api/v1/admin/billing",
            "/api/v1/admin/audit"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }
        String path = request.getRequestURI();
        String role = request.getHeader("X-User-Role");
        if (isAdminOnly(path) && !"ADMIN".equalsIgnoreCase(role)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(
                    "{\"success\":false,\"error\":{\"code\":\"AUTH_UNAUTHORIZED\",\"message\":\"Admin role required\"}}"
            );
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean isAdminOnly(String path) {
        if (path == null) {
            return false;
        }
        return ADMIN_ONLY.stream().anyMatch(prefix -> path.equals(prefix) || path.startsWith(prefix + "/"));
    }
}
