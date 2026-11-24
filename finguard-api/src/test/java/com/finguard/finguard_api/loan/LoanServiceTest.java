package com.finguard.finguard_api.loan;

import com.finguard.finguard_api.ai.CreditRiskService;
import com.finguard.finguard_api.ai.RiskAssessmentResponse;
import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.loan.dto.CreateLoanRequest;
import com.finguard.finguard_api.loan.dto.LoanResponse;
import com.finguard.finguard_api.loan.dto.ReviewLoanRequest;
import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import com.finguard.finguard_api.loan.dto.LoanStatsResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private CreditRiskService creditRiskService;

    @InjectMocks
    private LoanService loanService;

    private User loanOfficer;
    private User otherLoanOfficer;
    private User creditAnalyst;
    private LoanApplication pendingLoan;

    @BeforeEach
    void setUp() {
        loanOfficer = User.builder()
                .id(1L)
                .email("jane@finguard.com")
                .role(Role.LOAN_OFFICER)
                .build();

        otherLoanOfficer = User.builder()
                .id(3L)
                .email("bob@finguard.com")
                .role(Role.LOAN_OFFICER)
                .build();

        creditAnalyst = User.builder()
                .id(2L)
                .email("analyst@finguard.com")
                .role(Role.CREDIT_ANALYST)
                .build();

        pendingLoan = LoanApplication.builder()
                .id(10L)
                .borrowerName("John Kamau")
                .borrowerNationalId("32456789")
                .monthlyIncome(new BigDecimal("85000.00"))
                .existingMonthlyDebt(new BigDecimal("15000.00"))
                .requestedAmount(new BigDecimal("250000.00"))
                .repaymentMonths(12)
                .purpose("Expand hardware shop")
                .status(LoanStatus.PENDING)
                .submittedBy(loanOfficer)
                .build();
    }

    @Test
    void shouldSubmitLoanWithAiRiskScoreAndAuditLog() {
        CreateLoanRequest request = new CreateLoanRequest(
                "John Kamau",
                "32456789",
                new BigDecimal("120000.00"),
                new BigDecimal("15000.00"),
                new BigDecimal("250000.00"),
                12,
                "Expand hardware shop"
        );

        when(creditRiskService.assessRisk(any(LoanApplication.class)))
                .thenReturn(new RiskAssessmentResponse(22, "LOW", "Strong income-to-debt ratio."));
        when(loanRepository.save(any(LoanApplication.class))).thenAnswer(inv -> {
            LoanApplication saved = inv.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        LoanResponse response = loanService.submitLoan(request, loanOfficer);

        assertEquals(99L, response.id());
        assertEquals(LoanStatus.PENDING, response.status());
        assertEquals(22, response.aiRiskScore());
        assertEquals("LOW", response.aiRiskLevel());
        assertEquals("Strong income-to-debt ratio.", response.aiRecommendation());
        verify(auditLogService, times(1))
                .record(eq("LOAN_CREATED"), eq("LOAN_APPLICATION"), eq(99L), eq(loanOfficer), anyString());
    }

    @Test
    void shouldTransitionFromPendingToUnderReview() {
        when(loanRepository.findById(10L)).thenReturn(Optional.of(pendingLoan));
        when(loanRepository.save(any(LoanApplication.class))).thenAnswer(i -> i.getArgument(0));

        ReviewLoanRequest request = new ReviewLoanRequest(LoanStatus.UNDER_REVIEW, "Checking financials");
        LoanResponse response = loanService.updateLoanStatus(10L, request, creditAnalyst);

        assertEquals(LoanStatus.UNDER_REVIEW, response.status());
        assertEquals("analyst@finguard.com", response.reviewedByEmail());
        verify(auditLogService, times(1))
                .record(eq("LOAN_UNDER_REVIEW"), eq("LOAN_APPLICATION"), eq(10L), eq(creditAnalyst), anyString());
    }

    @Test
    void shouldBlockInvalidJumpFromPendingToApproved() {
        when(loanRepository.findById(10L)).thenReturn(Optional.of(pendingLoan));

        ReviewLoanRequest request = new ReviewLoanRequest(LoanStatus.APPROVED, "Skipping review");

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> loanService.updateLoanStatus(10L, request, creditAnalyst)
        );

        assertTrue(ex.getMessage().contains("Invalid status transition"));
        verify(loanRepository, never()).save(any());
        verify(auditLogService, never()).record(any(), any(), any(), any(), any());
    }

    @Test
    void shouldBlockSeparationOfDutiesViolation() {
        when(loanRepository.findById(10L)).thenReturn(Optional.of(pendingLoan));

        ReviewLoanRequest request = new ReviewLoanRequest(LoanStatus.UNDER_REVIEW, "Reviewing my own loan");

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> loanService.updateLoanStatus(10L, request, loanOfficer)
        );

        assertTrue(ex.getMessage().contains("Separation of duties violation"));
        verify(loanRepository, never()).save(any());
    }

    @Test
    void shouldBlockIdorWhenLoanOfficerViewsAnotherOfficersLoan() {
        when(loanRepository.findById(10L)).thenReturn(Optional.of(pendingLoan));

        assertThrows(
                AccessDeniedException.class,
                () -> loanService.getLoanById(10L, otherLoanOfficer)
        );
    }

    @Test
    void shouldAllowCreditAnalystToViewAnyLoan() {
        when(loanRepository.findById(10L)).thenReturn(Optional.of(pendingLoan));

        LoanResponse response = loanService.getLoanById(10L, creditAnalyst);

        assertEquals(10L, response.id());
        assertEquals("John Kamau", response.borrowerName());
    }

    @Test
    void shouldComputeGlobalLoanStatsForStaff() {
        when(loanRepository.sumTotalRequestedAmount()).thenReturn(new BigDecimal("1500000.00"));
        List<Object[]> statusCounts = List.of(
                new Object[]{LoanStatus.APPROVED, 3L},
                new Object[]{LoanStatus.PENDING, 1L}
        );
        List<Object[]> riskCounts = List.of(
                new Object[]{"LOW", 3L},
                new Object[]{"HIGH", 1L}
        );
        when(loanRepository.countByStatusGrouped()).thenReturn(statusCounts);
        when(loanRepository.countByAiRiskLevelGrouped()).thenReturn(riskCounts);

        LoanStatsResponse stats = loanService.getLoanStats(creditAnalyst);

        assertEquals(new BigDecimal("1500000.00"), stats.totalVolumeKes());
        assertEquals(4, stats.totalLoansCount());
        assertEquals(3, stats.approvedCount());
        assertEquals(1, stats.pendingCount());
        assertEquals(75.0, stats.approvalRate());
        assertEquals(3, stats.lowRiskCount());
        assertEquals(75.0, stats.lowRiskPercentage());
        assertEquals(1, stats.highRiskCount());
        assertEquals(25.0, stats.highRiskPercentage());
    }

    @Test
    void shouldComputeUserSpecificLoanStatsForBorrower() {
        User borrower = User.builder().id(5L).role(Role.USER).build();
        when(loanRepository.sumTotalRequestedAmountByUserId(5L)).thenReturn(new BigDecimal("300000.00"));
        List<Object[]> statusCounts = Collections.singletonList(
                new Object[]{LoanStatus.PENDING, 1L}
        );
        List<Object[]> riskCounts = Collections.singletonList(
                new Object[]{"MEDIUM", 1L}
        );
        when(loanRepository.countByStatusGroupedByUserId(5L)).thenReturn(statusCounts);
        when(loanRepository.countByAiRiskLevelGroupedByUserId(5L)).thenReturn(riskCounts);

        LoanStatsResponse stats = loanService.getLoanStats(borrower);

        assertEquals(new BigDecimal("300000.00"), stats.totalVolumeKes());
        assertEquals(1, stats.totalLoansCount());
        assertEquals(1, stats.pendingCount());
        assertEquals(0, stats.approvedCount());
        assertEquals(0.0, stats.approvalRate());
        assertEquals(1, stats.mediumRiskCount());
        assertEquals(100.0, stats.mediumRiskPercentage());
    }
}
