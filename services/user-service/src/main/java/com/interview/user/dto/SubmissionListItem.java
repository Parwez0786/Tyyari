package com.interview.user.dto;

import com.interview.user.model.Submission;

import java.time.Instant;

public record SubmissionListItem(
        String id,
        String scope,
        String questionId,
        String questionType,
        String assessmentSetId,
        String language,
        String view,
        int fileCount,
        boolean hasCanvas,
        boolean hasNotes,
        boolean hasQuiz,
        Integer quizScore,
        Integer quizTotal,
        Instant submittedAt
) {
    public static SubmissionListItem from(Submission submission) {
        int files = submission.getFiles() == null ? 0 : submission.getFiles().size();
        boolean notes = hasText(submission.getMath()) || hasText(submission.getExplanation());
        boolean quiz = submission.getQuizTotal() != null || (submission.getQuizAnswers() != null && !submission.getQuizAnswers().isEmpty());
        return new SubmissionListItem(
                submission.getId(),
                submission.getScope(),
                submission.getQuestionId(),
                submission.getQuestionType(),
                submission.getAssessmentSetId(),
                submission.getLanguage(),
                submission.getView(),
                files,
                submission.getCanvas() != null && !submission.getCanvas().isEmpty(),
                notes,
                quiz,
                submission.getQuizScore(),
                submission.getQuizTotal(),
                submission.getSubmittedAt()
        );
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
