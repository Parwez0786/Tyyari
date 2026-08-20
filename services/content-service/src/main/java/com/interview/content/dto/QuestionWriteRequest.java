package com.interview.content.dto;

import com.interview.content.model.Example;
import com.interview.content.model.QuizItem;

import java.util.List;

public record QuestionWriteRequest(
        String type,
        String subType,
        String title,
        String slug,
        String description,
        String difficulty,
        List<String> topics,
        List<String> companies,
        List<String> tags,
        List<String> constraints,
        List<String> functionalRequirements,
        List<String> nonFunctionalRequirements,
        List<Example> examples,
        List<QuizItem> quiz,
        List<String> hints,
        Boolean published
) {}
