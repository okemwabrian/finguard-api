package com.finguard.finguard_api.user.dto;

import com.finguard.finguard_api.user.Role;

public record LoginResponse(
        String token,
        String email,
        String fullName,
        Role role,
        boolean mustChangePassword,
        String phone,
        String nationalId
) {
    public LoginResponse(String token, String email, String fullName, Role role, boolean mustChangePassword) {
        this(token, email, fullName, role, mustChangePassword, null, null);
    }
}
