package com.finguard.finguard_api.user.dto;

import com.finguard.finguard_api.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        @NotNull Role role
) {}
