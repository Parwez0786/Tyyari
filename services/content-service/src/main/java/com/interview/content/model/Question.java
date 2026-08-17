package com.interview.content.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "questions")
@CompoundIndexes({
        @CompoundIndex(name = "type_difficulty", def = "{'type': 1, 'difficulty': 1}"),
        @CompoundIndex(name = "type_companies", def = "{'type': 1, 'companies': 1}"),
        @CompoundIndex(name = "type_topics", def = "{'type': 1, 'topics': 1}")
})
public class Question {
    @Id
    private String id;
    private String type;
    private String subType;
    private String title;
    @Indexed(unique = true)
    private String slug;
    private String description;
    private String difficulty;
    private List<String> topics;
    private List<String> companies;
    private List<String> tags;
    private List<String> constraints;
    private List<String> functionalRequirements;
    private List<String> nonFunctionalRequirements;
    private List<Example> examples;
    private List<String> hints;
    @Indexed
    @Field("isPublished")
    private boolean published;
    private boolean premium;
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;
}
