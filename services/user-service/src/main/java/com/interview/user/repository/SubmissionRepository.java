package com.interview.user.repository;

import com.interview.user.model.Submission;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends MongoRepository<Submission, String> {
    Optional<Submission> findByUniqueKey(String uniqueKey);

    List<Submission> findByUserIdAndScope(String userId, String scope);

    List<Submission> findByUserIdAndAssessmentSetIdOrderBySubmittedAtAsc(String userId, String assessmentSetId);

    List<Submission> findByUserIdOrderBySubmittedAtDesc(String userId);
}
