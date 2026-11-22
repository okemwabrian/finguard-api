package com.finguard.finguard_api.user;

import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.user.dto.CreateUserRequest;
import com.finguard.finguard_api.user.dto.UpdateUserStatusRequest;
import com.finguard.finguard_api.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    @PostMapping
    public ResponseEntity<?> onboardStaff(
            @Valid @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal User admin
    ) {
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email is already registered"));
        }

        User newUser = User.builder()
                .fullName(request.fullName())
                .email(request.email())
                .password(passwordEncoder.encode(request.temporaryPassword()))
                .role(request.role())
                .mustChangePassword(true)
                .active(true)
                .build();

        User saved = userRepository.save(newUser);
        auditLogService.record("USER_ONBOARDED", "USER", saved.getId(), admin,
                "Onboarded " + saved.getEmail() + " with role " + saved.getRole());

        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(saved));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> listAllUsers() {
        List<UserResponse> users = userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal User admin
    ) {
        if (admin.getId().equals(id) && !request.active()) {
            throw new IllegalStateException("You cannot suspend your own administrator account.");
        }

        User target = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        target.setActive(request.active());
        User saved = userRepository.save(target);

        auditLogService.record(
                request.active() ? "USER_REACTIVATED" : "USER_SUSPENDED",
                "USER",
                saved.getId(),
                admin,
                "Set active=" + request.active() + " for " + saved.getEmail()
        );

        return ResponseEntity.ok(UserResponse.from(saved));
    }
}
