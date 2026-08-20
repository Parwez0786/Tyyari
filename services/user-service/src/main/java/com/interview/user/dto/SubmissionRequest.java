package com.interview.user.dto;

import java.util.List;
import java.util.Map;

public record SubmissionRequest(
        String questionId,
        String questionType,
        String assessmentSetId,
        String language,
        String view,
        String activeId,
        String stdin,
        List<SubmissionFileDto> files,
        Map<String, Object> canvas,
        String math,
        String explanation,
        Integer quizScore,
        Integer quizTotal,
        List<Integer> quizAnswers
) {
    public record SubmissionFileDto(
            String id,
            String type,
            String name,
            String content
    ) {}
}
