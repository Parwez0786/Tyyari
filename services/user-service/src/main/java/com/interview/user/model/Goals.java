package com.interview.user.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "goals")
public class Goals {
    @Id
    private String id;
    @Indexed(unique = true)
    private String userId;
    private List<String> targetCompanies;
    private String targetRole;
    private LocalDate targetDate;
    private int dailyGoalMinutes;
}
