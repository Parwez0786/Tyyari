package com.interview.user.repository;

import com.interview.user.model.Preferences;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PreferencesRepository extends MongoRepository<Preferences, String> {
    Optional<Preferences> findByUserId(String userId);
    void deleteByUserId(String userId);
}
