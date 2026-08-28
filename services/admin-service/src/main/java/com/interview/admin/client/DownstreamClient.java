package com.interview.admin.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

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

    public ResponseEntity<String> usersFile(String method, String path, MultipartFile file, String userId) {
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new IllegalStateException("Could not read upload", e);
        }
        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            filename = "avatar.jpg";
        }
        String name = filename;
        ByteArrayResource resource = new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return name;
            }
        };
        MultiValueMap<String, Object> parts = new LinkedMultiValueMap<>();
        parts.add("file", resource);
        return restClient.method(HttpMethod.valueOf(method))
                .uri(userUrl + path)
                .header("X-User-Id", userId == null ? "" : userId)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(parts)
                .retrieve()
                .onStatus(status -> true, (request, resp) -> { })
                .toEntity(String.class);
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
