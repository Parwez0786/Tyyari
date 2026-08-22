package com.interview.content.dto;

import com.interview.content.model.Example;
import com.interview.content.model.QuizItem;
import com.interview.content.model.StarterFile;
import com.interview.content.model.TestCase;

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
        List<Example> examples,
        List<TestCase> testcases,
        List<StarterFile> starterFiles,
        String estimates,
        String canvasNotes,
        List<QuizItem> quiz,
        List<String> hints,
        boolean premium,
        boolean locked
) {}
