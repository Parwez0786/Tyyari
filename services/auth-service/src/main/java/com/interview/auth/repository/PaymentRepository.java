package com.interview.auth.repository;

import com.interview.auth.model.Payment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends MongoRepository<Payment, String> {
    Optional<Payment> findByProviderRef(String providerRef);
    List<Payment> findAllByOrderByCreatedAtDesc();
    List<Payment> findByUserIdOrderByCreatedAtDesc(String userId);
    void deleteByUserId(String userId);
}
