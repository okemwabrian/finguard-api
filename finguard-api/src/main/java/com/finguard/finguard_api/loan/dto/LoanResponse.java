package com.finguard.finguard_api.loan.dto;

import com.finguard.finguard_api.loan.LoanApplication;
import com.finguard.finguard_api.loan.LoanStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LoanResponse(
        Long id,
        String borrowerName,
        String borrowerNationalId,
        BigDecimal monthlyIncome,
        BigDecimal existingMonthlyDebt,
        BigDecimal requestedAmount,
        Integer repaymentMonths,
        String purpose,
        LoanStatus status,
        Integer aiRiskScore,
        String aiRiskLevel,
        String aiRecommendation,
        String reviewerNotes,
        String submittedByEmail,
        String reviewedByEmail,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static LoanResponse from(LoanApplication loan) {
        return new LoanResponse(
                loan.getId(),
                loan.getBorrowerName(),
                loan.getBorrowerNationalId(),
                loan.getMonthlyIncome(),
                loan.getExistingMonthlyDebt(),
                loan.getRequestedAmount(),
                loan.getRepaymentMonths(),
                loan.getPurpose(),
                loan.getStatus(),
                loan.getAiRiskScore(),
                loan.getAiRiskLevel(),
                loan.getAiRecommendation(),
                loan.getReviewerNotes(),
                loan.getSubmittedBy().getEmail(),
                loan.getReviewedBy() != null ? loan.getReviewedBy().getEmail() : null,
                loan.getCreatedAt(),
                loan.getUpdatedAt()
        );
    }
}
