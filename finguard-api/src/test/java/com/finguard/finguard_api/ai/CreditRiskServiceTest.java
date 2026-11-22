package com.finguard.finguard_api.ai;

import tools.jackson.databind.ObjectMapper;
import com.finguard.finguard_api.loan.LoanApplication;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class CreditRiskServiceTest {

    private CreditRiskService creditRiskService;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        creditRiskService = new CreditRiskService(objectMapper);
        // Point to an invalid key to test deterministic fallback
        ReflectionTestUtils.setField(creditRiskService, "apiKey", "invalid_key");
        ReflectionTestUtils.setField(creditRiskService, "model", "gemini-3.8-flash");
    }

    @Test
    void shouldFallbackToLowRiskForHealthyDti() {
        LoanApplication loan = LoanApplication.builder()
                .borrowerName("Healthy Borrower")
                .monthlyIncome(new BigDecimal("100000.00"))
                .existingMonthlyDebt(new BigDecimal("5000.00"))
                .requestedAmount(new BigDecimal("120000.00"))
                .repaymentMonths(12) // monthly installment 10,000 -> total debt 15,000 -> DTI 15%
                .purpose("Farm expansion")
                .build();

        RiskAssessmentResponse response = creditRiskService.assessRisk(loan);

        assertNotNull(response);
        assertEquals("LOW", response.riskLevel());
        assertEquals(25, response.riskScore());
        assertTrue(response.recommendation().contains("Fallback DTI assessment"));
    }

    @Test
    void shouldFallbackToHighRiskForExcessiveDti() {
        LoanApplication loan = LoanApplication.builder()
                .borrowerName("High Risk Borrower")
                .monthlyIncome(new BigDecimal("40000.00"))
                .existingMonthlyDebt(new BigDecimal("20000.00"))
                .requestedAmount(new BigDecimal("240000.00"))
                .repaymentMonths(12) // monthly installment 20,000 -> total debt 40,000 -> DTI 100%
                .purpose("Luxury goods")
                .build();

        RiskAssessmentResponse response = creditRiskService.assessRisk(loan);

        assertNotNull(response);
        assertEquals("HIGH", response.riskLevel());
        assertEquals(85, response.riskScore());
        assertTrue(response.recommendation().contains("High debt-to-income ratio"));
    }
}
