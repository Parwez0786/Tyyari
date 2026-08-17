package com.interview.content.repository;

import com.interview.content.model.Question;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface QuestionRepository extends MongoRepository<Question, String> {
    Optional<Question> findBySlug(String slug);
    boolean existsBySlug(String slug);
    long countByPublishedTrue();
    long countByTypeAndPublishedTrue(String type);
}
