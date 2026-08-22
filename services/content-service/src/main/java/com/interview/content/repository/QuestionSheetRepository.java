package com.interview.content.repository;

import com.interview.content.model.QuestionSheet;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface QuestionSheetRepository extends MongoRepository<QuestionSheet, String> {
    Optional<QuestionSheet> findBySlug(String slug);
    boolean existsBySlug(String slug);
    List<QuestionSheet> findByPublishedTrueOrderByCreatedAtAsc();
    List<QuestionSheet> findByTypeAndPublishedTrueOrderByCreatedAtAsc(String type);
    List<QuestionSheet> findAllByOrderByUpdatedAtDesc();
}
