package com.interview.user.repository;

import com.interview.user.model.Goals;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface GoalsRepository extends MongoRepository<Goals, String> {
    Optional<Goals> findByUserId(String userId);
    void deleteByUserId(String userId);
}
