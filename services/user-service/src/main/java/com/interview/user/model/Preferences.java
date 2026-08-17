package com.interview.user.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "preferences")
public class Preferences {
    @Id
    private String id;
    @Indexed(unique = true)
    private String userId;
    private String preferredLanguage;
    private String theme;
    private boolean emailNotifications;
    private String difficultyPreference;
}
