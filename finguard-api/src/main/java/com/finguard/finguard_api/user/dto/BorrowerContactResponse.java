package com.finguard.finguard_api.user.dto;

import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;

public record BorrowerContactResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        Role role
) {
    public static BorrowerContactResponse from(User user) {
        return new BorrowerContactResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole()
        );
    }
}
