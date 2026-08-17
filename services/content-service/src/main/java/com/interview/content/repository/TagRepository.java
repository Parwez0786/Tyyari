package com.interview.content.repository;

import com.interview.content.model.Tag;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface TagRepository extends MongoRepository<Tag, String> {
    Optional<Tag> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
