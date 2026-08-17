package com.interview.auth.repository;

import com.interview.auth.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleSub(String googleSub);
    Optional<User> findByGithubId(String githubId);
    boolean existsByEmail(String email);
}
