package com.interview.user.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "profiles")
public class Profile {
    @Id
    private String id;
    @Indexed(unique = true)
    private String userId;
    private String name;
    private String avatar;
    private String bio;
    private String githubUrl;
    private String linkedinUrl;
    private String experience;
    private String currentRole;
    private String targetRole;
    private List<String> skills;
    private boolean onboarded;
    private Instant createdAt;
    private Instant updatedAt;
}
