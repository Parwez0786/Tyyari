package com.interview.admin.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class DownstreamClient {
    private final RestClient restClient;
    private final String contentUrl;
    private final String authUrl;
    private final String userUrl;

    public DownstreamClient(
            RestClient restClient,
            @Value("${app.content-service-url}") String contentUrl,
            @Value("${app.auth-service-url}") String authUrl,
            @Value("${app.user-service-url}") String userUrl
    ) {
        this.restClient = restClient;
        this.contentUrl = contentUrl;
        this.authUrl = authUrl;
        this.userUrl = userUrl;
    }

    public ResponseEntity<String> content(String method, String path, String body, String userId) {
        return call(contentUrl + path, method, body, userId);
    }

    public ResponseEntity<String> auth(String method, String path, String body, String userId) {
        return call(authUrl + path, method, body, userId);
    }

    public ResponseEntity<String> users(String method, String path, String body, String userId) {
        return call(userUrl + path, method, body, userId);
    }

    private ResponseEntity<String> call(String url, String method, String body, String userId) {
        RestClient.RequestBodySpec spec = restClient.method(HttpMethod.valueOf(method))
                .uri(url)
                .header("X-User-Id", userId == null ? "" : userId)
                .header("Content-Type", "application/json");
        boolean withBody = body != null && !body.isBlank() && !"GET".equals(method) && !"DELETE".equals(method);
        RestClient.ResponseSpec response = withBody ? spec.body(body).retrieve() : spec.retrieve();
        return response
                .onStatus(status -> true, (request, resp) -> { })
                .toEntity(String.class);
    }
}
