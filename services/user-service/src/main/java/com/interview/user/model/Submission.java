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
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "submissions")
public class Submission {
    public static final String SCOPE_PRACTICE = "PRACTICE";
    public static final String SCOPE_OA = "OA";

    @Id
    private String id;
    @Indexed(unique = true)
    private String uniqueKey;
    @Indexed
    private String userId;
    private String scope;
    @Indexed
    private String questionId;
    private String questionType;
    private String assessmentSetId;
    private String language;
    private String view;
    private String activeId;
    private String stdin;
    private List<SubmissionFile> files;
    private Map<String, Object> canvas;
    private String math;
    private String explanation;
    private Instant submittedAt;
}
