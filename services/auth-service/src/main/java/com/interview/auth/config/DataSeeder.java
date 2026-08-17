package com.interview.auth.config;

import com.interview.auth.event.UserEventPublisher;
import com.interview.auth.model.User;
import com.interview.auth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class DataSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final UserEventPublisher events;

    public DataSeeder(UserRepository users, PasswordEncoder encoder, UserEventPublisher events) {
        this.users = users;
        this.encoder = encoder;
        this.events = events;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed("admin@tyyari.dev", "Admin@12345", User.Role.ADMIN, "Tyyari Admin");
        seed("demo@tyyari.dev", "Demo@12345", User.Role.USER, "Demo Candidate");
    }

    private void seed(String email, String password, User.Role role, String name) {
        if (users.existsByEmail(email)) {
            return;
        }
        Instant now = Instant.now();
        User user = users.save(User.builder()
                .email(email)
                .passwordHash(encoder.encode(password))
                .role(role)
                .status(User.Status.ACTIVE)
                .emailVerified(true)
                .provider("LOCAL")
                .createdAt(now)
                .updatedAt(now)
                .build());
        events.publishRegistered(user.getId(), email, name);
        log.info("Seeded {} ({})", email, role);
    }
}
