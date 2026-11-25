package com.finguard.finguard_api.loan.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record CreateLoanRequest(
        @NotBlank String borrowerName,
        @NotBlank String borrowerNationalId,
        @NotNull @DecimalMin("1.00") BigDecimal monthlyIncome,
        @NotNull @DecimalMin("0.00") BigDecimal existingMonthlyDebt,
        @NotNull @DecimalMin("100.00") BigDecimal requestedAmount,
        @NotNull @Min(1) @Max(360) Integer repaymentMonths,
        @NotBlank @Size(max = 500) String purpose,
        BigDecimal interestRate,
        Integer termMonths
) {
    public CreateLoanRequest(
            String borrowerName,
            String borrowerNationalId,
            BigDecimal monthlyIncome,
            BigDecimal existingMonthlyDebt,
            BigDecimal requestedAmount,
            Integer repaymentMonths,
            String purpose
    ) {
        this(borrowerName, borrowerNationalId, monthlyIncome, existingMonthlyDebt, requestedAmount, repaymentMonths, purpose, null, null);
    }
}
