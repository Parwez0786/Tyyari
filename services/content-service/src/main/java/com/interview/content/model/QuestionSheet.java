package com.interview.content.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "question_sheets")
public class QuestionSheet {
    @Id
    private String id;
    @Indexed(unique = true)
    private String slug;
    private String title;
    private String description;
    @Indexed
    private String type;
    private String difficulty;
    private List<String> companies;
    private List<String> questionSlugs;
    @Indexed
    @Field("isPublished")
    private boolean published;
    private Instant createdAt;
    private Instant updatedAt;
}
