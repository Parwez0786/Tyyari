package com.interview.user.dto;

import com.interview.user.model.Submission;
import com.interview.user.model.SubmissionFile;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record SubmissionResponse(
        String id,
        String scope,
        String questionId,
        String questionType,
        String assessmentSetId,
        String language,
        String view,
        String activeId,
        String stdin,
        List<SubmissionFile> files,
        Map<String, Object> canvas,
        String math,
        String explanation,
        Integer quizScore,
        Integer quizTotal,
        List<Integer> quizAnswers,
        Instant submittedAt
) {
    public static SubmissionResponse from(Submission submission) {
        return new SubmissionResponse(
                submission.getId(),
                submission.getScope(),
                submission.getQuestionId(),
                submission.getQuestionType(),
                submission.getAssessmentSetId(),
                submission.getLanguage(),
                submission.getView(),
                submission.getActiveId(),
                submission.getStdin(),
                submission.getFiles(),
                submission.getCanvas(),
                submission.getMath(),
                submission.getExplanation(),
                submission.getQuizScore(),
                submission.getQuizTotal(),
                submission.getQuizAnswers(),
                submission.getSubmittedAt()
        );
    }
}
