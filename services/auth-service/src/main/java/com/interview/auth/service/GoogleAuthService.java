package com.interview.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.interview.auth.dto.LoginResponse;
import com.interview.auth.event.UserEventPublisher;
import com.interview.auth.exception.ApiException;
import com.interview.auth.exception.ErrorCode;
import com.interview.auth.model.User;
import com.interview.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class GoogleAuthService {
    private final UserRepository users;
    private final AuthService authService;
    private final UserEventPublisher events;
    private final String clientId;

    public GoogleAuthService(
            UserRepository users,
            AuthService authService,
            UserEventPublisher events,
            @Value("${app.google.client-id:}") String clientId
    ) {
        this.users = users;
        this.authService = authService;
        this.events = events;
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    public boolean enabled() {
        return StringUtils.hasText(clientId);
    }

    public String clientId() {
        return enabled() ? clientId : "";
    }

    public LoginResponse login(String idToken, String device) {
        if (!enabled()) {
            throw new ApiException(ErrorCode.AUTH_GOOGLE_UNAVAILABLE, "Google sign-in is not configured", HttpStatus.SERVICE_UNAVAILABLE);
        }
        GoogleIdToken.Payload payload = verify(idToken);
        String email = payload.getEmail().trim().toLowerCase(Locale.ROOT);
        String name = (String) payload.get("name");
        String sub = payload.getSubject();

        User user = users.findByGoogleSub(sub).orElseGet(() -> users.findByEmail(email).orElse(null));
        Instant now = Instant.now();
        boolean created = false;
        if (user == null) {
            user = users.save(User.builder()
                    .email(email)
                    .role(User.Role.USER)
                    .status(User.Status.ACTIVE)
                    .emailVerified(true)
                    .provider("GOOGLE")
                    .googleSub(sub)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
            created = true;
        } else {
            if (user.getGoogleSub() == null) {
                user.setGoogleSub(sub);
            }
            user.setProvider(user.getProvider() == null ? "GOOGLE" : user.getProvider());
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

    private GoogleIdToken.Payload verify(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance()
            ).setAudience(List.of(clientId)).build();
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Invalid Google token", HttpStatus.UNAUTHORIZED);
            }
            return token.getPayload();
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED, "Could not verify Google token", HttpStatus.UNAUTHORIZED);
        }
    }
}
