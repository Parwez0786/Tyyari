package com.interview.content.dto;

import com.interview.content.model.Example;

import java.util.List;

public record QuestionDetail(
        String id,
        String title,
        String slug,
        String type,
        String subType,
        String difficulty,
        String description,
        List<String> topics,
        List<String> companies,
        List<String> tags,
        List<String> constraints,
        List<String> functionalRequirements,
        List<String> nonFunctionalRequirements,
        List<Example> examples
) {}
