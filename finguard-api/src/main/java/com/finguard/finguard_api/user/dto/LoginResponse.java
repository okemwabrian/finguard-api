package com.finguard.finguard_api.user.dto;

import com.finguard.finguard_api.user.Role;

public record LoginResponse(
        String token,
        String email,
        String fullName,
        Role role,
        boolean mustChangePassword
) {}
