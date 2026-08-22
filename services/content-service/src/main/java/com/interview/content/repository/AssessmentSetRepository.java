package com.interview.content.repository;

import com.interview.content.model.AssessmentSet;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface AssessmentSetRepository extends MongoRepository<AssessmentSet, String> {
    Optional<AssessmentSet> findBySlug(String slug);
    boolean existsBySlug(String slug);
    List<AssessmentSet> findByPublishedTrueOrderByCreatedAtAsc();
    List<AssessmentSet> findAllByOrderByUpdatedAtDesc();
}
