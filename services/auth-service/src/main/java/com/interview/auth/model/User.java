package com.interview.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String id;
    @Indexed(unique = true)
    private String email;
    @JsonIgnore
    private String passwordHash;
    private Role role;
    private Status status;
    private boolean emailVerified;
    private String provider;
    private String googleSub;
    private String githubId;
    private boolean premium;
    private Instant premiumUntil;
    private String stripeCustomerId;
    private Instant createdAt;
    private Instant updatedAt;

    public enum Role { USER, ADMIN, EDITOR }
    public enum Status { ACTIVE, DISABLED, DELETING }
}
