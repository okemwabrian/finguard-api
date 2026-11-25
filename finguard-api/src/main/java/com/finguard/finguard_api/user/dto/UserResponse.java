package com.finguard.finguard_api.user.dto;

import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        Role role,
        boolean mustChangePassword,
        boolean active,
        String phone,
        String nationalId
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.isMustChangePassword(),
                user.isActive(),
                user.getPhone(),
                user.getNationalId()
        );
    }
}
