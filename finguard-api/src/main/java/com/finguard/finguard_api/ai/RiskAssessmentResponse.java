package com.finguard.finguard_api.ai;

public record RiskAssessmentResponse(
        int riskScore,         // 0 (safest) to 100 (highest risk)
        String riskLevel,      // LOW, MEDIUM, or HIGH
        String recommendation  // Concise underwriter rationale
) {}
