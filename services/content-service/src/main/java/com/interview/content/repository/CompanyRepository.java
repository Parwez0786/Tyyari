package com.interview.content.repository;

import com.interview.content.model.Company;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CompanyRepository extends MongoRepository<Company, String> {
    Optional<Company> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
