package com.finguard.finguard_api.loan.dto;

import java.math.BigDecimal;

public record LoanStatsResponse(
        BigDecimal totalVolumeKes,
        long totalLoansCount,
        long pendingCount,
        long underReviewCount,
        long approvedCount,
        long rejectedCount,
        double approvalRate,
        long lowRiskCount,
        long mediumRiskCount,
        long highRiskCount,
        double lowRiskPercentage,
        double mediumRiskPercentage,
        double highRiskPercentage
) {}
