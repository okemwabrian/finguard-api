package com.finguard.finguard_api.user;

import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.security.JwtService;
import com.finguard.finguard_api.user.dto.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class RegistrationController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;

    @PostMapping("/register")
    public ResponseEntity<?> registerBorrower(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "An account with this email already exists."));
        }

        User newUser = User.builder()
                .fullName(request.fullName())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .phone(request.phone())
                .nationalId(request.nationalId())
                .mustChangePassword(false)
                .active(true)
                .build();

        User saved = userRepository.save(newUser);
        String token = jwtService.generateToken(saved);

        auditLogService.record(
                "USER_REGISTERED",
                "USER",
                saved.getId(),
                saved,
                "User registered: " + saved.getEmail()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "token", token,
                "email", saved.getEmail(),
                "fullName", saved.getFullName(),
                "role", saved.getRole().name(),
                "phone", saved.getPhone() != null ? saved.getPhone() : "",
                "nationalId", saved.getNationalId() != null ? saved.getNationalId() : "",
                "mustChangePassword", false
        ));
    }
}
