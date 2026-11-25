package com.finguard.finguard_api.loan.dto;

import com.finguard.finguard_api.loan.LoanStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ReviewLoanRequest(
        @NotNull LoanStatus newStatus,
        @NotBlank String reviewerNotes,
        @DecimalMin("100.00") BigDecimal approvedAmount
) {
    public ReviewLoanRequest(LoanStatus newStatus, String reviewerNotes) {
        this(newStatus, reviewerNotes, null);
    }
}
