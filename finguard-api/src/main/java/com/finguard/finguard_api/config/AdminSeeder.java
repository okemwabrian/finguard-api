package com.finguard.finguard_api.config;

import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import com.finguard.finguard_api.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String adminEmail = "admin@finguard.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .fullName("System Administrator")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ADMIN)
                    .mustChangePassword(false)
                    .active(true)
                    .build();
            userRepository.save(admin);
            log.info("Seeded default ADMIN user: {} / Admin@123", adminEmail);
        }
    }
}
