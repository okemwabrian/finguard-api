package com.finguard.finguard_api.loan.dto;

import com.finguard.finguard_api.loan.LoanStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReviewLoanRequest(
        @NotNull LoanStatus newStatus,
        @NotBlank String reviewerNotes
) {}
