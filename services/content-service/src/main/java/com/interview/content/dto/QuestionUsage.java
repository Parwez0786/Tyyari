package com.interview.content.dto;

import java.util.List;

public record QuestionUsage(List<Ref> sheets, List<Ref> assessmentSets) {
    public record Ref(String id, String title, String slug) {}
}
