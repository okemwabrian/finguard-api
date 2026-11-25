package com.finguard.finguard_api.user;

import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.config.CacheConfig;
import com.finguard.finguard_api.user.dto.UpdateProfileRequest;
import com.finguard.finguard_api.user.dto.UserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(@AuthenticationPrincipal User currentUser) {
        User fresh = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return ResponseEntity.ok(UserResponse.from(fresh));
    }

    @PutMapping("/me")
    @CacheEvict(value = CacheConfig.CACHE_ADMIN_USERS, allEntries = true)
    public ResponseEntity<UserResponse> updateMyProfile(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone() != null ? request.phone().trim() : null);
        user.setNationalId(request.nationalId() != null ? request.nationalId().trim() : null);

        User saved = userRepository.save(user);
        auditLogService.record("PROFILE_UPDATED", "USER", saved.getId(), saved,
                "Updated profile information for " + saved.getEmail());

        return ResponseEntity.ok(UserResponse.from(saved));
    }
}
