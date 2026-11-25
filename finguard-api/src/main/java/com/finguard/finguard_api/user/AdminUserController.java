package com.finguard.finguard_api.user;

import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.config.CacheConfig;
import com.finguard.finguard_api.document.LoanDocumentRepository;
import com.finguard.finguard_api.loan.LoanRepository;
import com.finguard.finguard_api.notification.NotificationRepository;
import com.finguard.finguard_api.user.dto.CreateUserRequest;
import com.finguard.finguard_api.user.dto.UpdateUserRequest;
import com.finguard.finguard_api.user.dto.UpdateUserStatusRequest;
import com.finguard.finguard_api.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
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
    private final NotificationRepository notificationRepository;
    private final LoanRepository loanRepository;
    private final LoanDocumentRepository loanDocumentRepository;

    @PostMapping
    @CacheEvict(value = CacheConfig.CACHE_ADMIN_USERS, allEntries = true)
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
    @Cacheable(value = CacheConfig.CACHE_ADMIN_USERS)
    public ResponseEntity<List<UserResponse>> listAllUsers() {
        List<UserResponse> users = userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}")
    @CacheEvict(value = CacheConfig.CACHE_ADMIN_USERS, allEntries = true)
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal User admin
    ) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        if (!target.getEmail().equalsIgnoreCase(request.email()) && userRepository.existsByEmail(request.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email is already in use by another account."));
        }

        target.setFullName(request.fullName());
        target.setEmail(request.email());
        target.setRole(request.role());
        User saved = userRepository.save(target);

        auditLogService.record("USER_UPDATED", "USER", saved.getId(), admin,
                "Updated user " + saved.getEmail() + " (Role: " + saved.getRole() + ")");

        return ResponseEntity.ok(UserResponse.from(saved));
    }

    @PatchMapping("/{id}/status")
    @CacheEvict(value = CacheConfig.CACHE_ADMIN_USERS, allEntries = true)
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

    @DeleteMapping("/{id}")
    @Transactional
    @CacheEvict(value = CacheConfig.CACHE_ADMIN_USERS, allEntries = true)
    public ResponseEntity<?> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin
    ) {
        if (admin.getId().equals(id)) {
            throw new IllegalStateException("You cannot delete your own administrator account.");
        }

        User target = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        if (loanRepository.countBySubmittedById(id) > 0 || loanDocumentRepository.countByUploadedById(id) > 0) {
            throw new IllegalStateException(
                    "Cannot delete " + target.getEmail() + " because they have existing loan applications or uploaded documents. Suspend their account instead."
            );
        }

        notificationRepository.deleteByRecipientId(id);
        loanRepository.clearReviewedByUserId(id);
        loanRepository.clearBorrowerByUserId(id);
        loanDocumentRepository.clearVerifiedByUserId(id);

        userRepository.delete(target);
        auditLogService.record("USER_DELETED", "USER", id, admin,
                "Deleted user account " + target.getEmail());

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reset-password")
    @CacheEvict(value = CacheConfig.CACHE_ADMIN_USERS, allEntries = true)
    public ResponseEntity<Map<String, String>> resetPasswordToDefault(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal User admin
    ) {
        User target = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));

        String defaultPassword = (body != null && body.get("defaultPassword") != null && !body.get("defaultPassword").isBlank())
                ? body.get("defaultPassword").trim()
                : "1234";

        target.setPassword(passwordEncoder.encode(defaultPassword));
        target.setMustChangePassword(true);
        target.setFailedLoginAttempts(0);
        target.setActive(true);
        userRepository.save(target);

        auditLogService.record(
                "USER_PASSWORD_RESET",
                "USER",
                target.getId(),
                admin,
                "Reset password to default temporary password for " + target.getEmail()
        );

        return ResponseEntity.ok(Map.of(
                "message", "Password reset to default for " + target.getEmail(),
                "defaultPassword", defaultPassword
        ));
    }
}
