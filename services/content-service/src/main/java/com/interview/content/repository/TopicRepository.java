package com.interview.content.repository;

import com.interview.content.model.Topic;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface TopicRepository extends MongoRepository<Topic, String> {
    Optional<Topic> findBySlug(String slug);
    boolean existsBySlug(String slug);
    List<Topic> findByCategory(String category);
}
