package com.interview.auth.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.interview.auth.dto.LoginResponse;
import com.interview.auth.event.UserEventPublisher;
import com.interview.auth.exception.ApiException;
import com.interview.auth.exception.ErrorCode;
import com.interview.auth.model.User;
import com.interview.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.Arrays;
import java.util.Locale;

@Service
public class GitHubAuthService {
    private final UserRepository users;
    private final AuthService authService;
    private final UserEventPublisher events;
    private final RestClient http;
    private final String clientId;
    private final String clientSecret;
    private final String defaultRedirectUri;

    public GitHubAuthService(
            UserRepository users,
            AuthService authService,
            UserEventPublisher events,
            @Value("${app.github.client-id:}") String clientId,
            @Value("${app.github.client-secret:}") String clientSecret,
            @Value("${app.github.redirect-uri:http://localhost:3000/auth/github}") String defaultRedirectUri
    ) {
        this.users = users;
        this.authService = authService;
        this.events = events;
        this.clientId = clientId == null ? "" : clientId.trim();
        this.clientSecret = clientSecret == null ? "" : clientSecret.trim();
        this.defaultRedirectUri = defaultRedirectUri == null ? "" : defaultRedirectUri.trim();
        this.http = RestClient.builder()
                .defaultHeader(HttpHeaders.USER_AGENT, "Tyyari-Auth")
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public boolean enabled() {
        return StringUtils.hasText(clientId) && StringUtils.hasText(clientSecret);
    }

    public String clientId() {
        return enabled() ? clientId : "";
    }

    public LoginResponse login(String code, String redirectUri, String device) {
        if (!enabled()) {
            throw new ApiException(ErrorCode.AUTH_GITHUB_UNAVAILABLE, "GitHub sign-in is not configured", HttpStatus.SERVICE_UNAVAILABLE);
        }
        String token = exchangeCode(code, StringUtils.hasText(redirectUri) ? redirectUri : defaultRedirectUri);
        GitHubUser profile = fetchUser(token);
        String email = resolveEmail(token, profile);
        String githubId = String.valueOf(profile.id());
        String name = StringUtils.hasText(profile.name()) ? profile.name() : profile.login();

        User user = users.findByGithubId(githubId).orElseGet(() -> users.findByEmail(email).orElse(null));
        Instant now = Instant.now();
        boolean created = false;
        if (user == null) {
            user = users.save(User.builder()
                    .email(email)
                    .role(User.Role.USER)
                    .status(User.Status.ACTIVE)
                    .emailVerified(true)
                    .provider("GITHUB")
                    .githubId(githubId)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
            created = true;
        } else {
            if (user.getGithubId() == null) {
                user.setGithubId(githubId);
            }
            user.setProvider(user.getProvider() == null ? "GITHUB" : user.getProvider());
            user.setEmailVerified(true);
            user.setUpdatedAt(now);
            users.save(user);
        }
        if (created) {
            events.publishRegistered(user.getId(), email, name == null ? email : name);
        }
        authService.rejectIfDisabled(user);
        return authService.issueTokens(user, device);
    }

    private String exchangeCode(String code, String redirectUri) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("code", code);
        form.add("redirect_uri", redirectUri);
        try {
            GitHubTokenResponse token = http.post()
                    .uri("https://github.com/login/oauth/access_token")
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(GitHubTokenResponse.class);
            if (token == null || !StringUtils.hasText(token.accessToken())) {
                String detail = token != null && StringUtils.hasText(token.errorDescription())
                        ? token.errorDescription()
                        : "Could not exchange GitHub code";
                throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, detail, HttpStatus.UNAUTHORIZED);
            }
            return token.accessToken();
        } catch (ApiException e) {
            throw e;
        } catch (RestClientException e) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Could not complete GitHub sign-in", HttpStatus.UNAUTHORIZED);
        }
    }

    private GitHubUser fetchUser(String accessToken) {
        try {
            GitHubUser user = http.get()
                    .uri("https://api.github.com/user")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(GitHubUser.class);
            if (user == null || user.id() == null) {
                throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Could not load GitHub profile", HttpStatus.UNAUTHORIZED);
            }
            return user;
        } catch (ApiException e) {
            throw e;
        } catch (RestClientException e) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Could not load GitHub profile", HttpStatus.UNAUTHORIZED);
        }
    }

    private String resolveEmail(String accessToken, GitHubUser profile) {
        if (StringUtils.hasText(profile.email())) {
            return profile.email().trim().toLowerCase(Locale.ROOT);
        }
        try {
            GitHubEmail[] emails = http.get()
                    .uri("https://api.github.com/user/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(GitHubEmail[].class);
            if (emails == null || emails.length == 0) {
                throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "GitHub account has no email", HttpStatus.UNAUTHORIZED);
            }
            return Arrays.stream(emails)
                    .filter(e -> e.primary() && e.verified() && StringUtils.hasText(e.email()))
                    .map(e -> e.email().trim().toLowerCase(Locale.ROOT))
                    .findFirst()
                    .or(() -> Arrays.stream(emails)
                            .filter(e -> e.verified() && StringUtils.hasText(e.email()))
                            .map(e -> e.email().trim().toLowerCase(Locale.ROOT))
                            .findFirst())
                    .orElseThrow(() -> new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "GitHub account has no verified email", HttpStatus.UNAUTHORIZED));
        } catch (ApiException e) {
            throw e;
        } catch (RestClientException e) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Could not load GitHub email", HttpStatus.UNAUTHORIZED);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GitHubTokenResponse(
            @JsonProperty("access_token") String accessToken,
            String error,
            @JsonProperty("error_description") String errorDescription
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GitHubUser(Long id, String login, String name, String email) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GitHubEmail(String email, boolean primary, boolean verified) {}
}
