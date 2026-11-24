package com.finguard.finguard_api.loan;

import com.finguard.finguard_api.ai.CreditRiskService;
import com.finguard.finguard_api.ai.RiskAssessmentResponse;
import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.loan.dto.CreateLoanRequest;
import com.finguard.finguard_api.loan.dto.LoanResponse;
import com.finguard.finguard_api.loan.dto.ReviewLoanRequest;
import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final AuditLogService auditLogService;
    private final CreditRiskService creditRiskService;

    @Transactional
    public LoanResponse submitLoan(CreateLoanRequest request, User loanOfficer) {
        LoanApplication loan = LoanApplication.builder()
                .borrowerName(request.borrowerName())
                .borrowerNationalId(request.borrowerNationalId())
                .monthlyIncome(request.monthlyIncome())
                .existingMonthlyDebt(request.existingMonthlyDebt())
                .requestedAmount(request.requestedAmount())
                .repaymentMonths(request.repaymentMonths())
                .purpose(request.purpose())
                .status(LoanStatus.PENDING)
                .submittedBy(loanOfficer)
                .build();

        RiskAssessmentResponse risk = creditRiskService.assessRisk(loan);
        loan.setAiRiskScore(risk.riskScore());
        loan.setAiRiskLevel(risk.riskLevel());
        loan.setAiRecommendation(risk.recommendation());

        LoanApplication saved = loanRepository.save(loan);

        auditLogService.record(
                "LOAN_CREATED",
                "LOAN_APPLICATION",
                saved.getId(),
                loanOfficer,
                "Submitted loan for " + saved.getBorrowerName()
                        + " (Amount: " + saved.getRequestedAmount()
                        + ", AI Risk: " + saved.getAiRiskLevel() + " [" + saved.getAiRiskScore() + "])"
        );

        return LoanResponse.from(saved);
    }

    @Transactional
    public LoanResponse updateLoanStatus(Long loanId, ReviewLoanRequest request, User analyst) {
        LoanApplication loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + loanId));

        if (loan.getSubmittedBy().getId().equals(analyst.getId())) {
            throw new IllegalStateException("Separation of duties violation: You cannot review your own loan submission.");
        }

        if (!loan.getStatus().canTransitionTo(request.newStatus())) {
            throw new IllegalStateException(
                    "Invalid status transition from " + loan.getStatus() + " to " + request.newStatus()
            );
        }

        LoanStatus previousStatus = loan.getStatus();
        loan.setStatus(request.newStatus());
        loan.setReviewerNotes(request.reviewerNotes());
        loan.setReviewedBy(analyst);

        LoanApplication updated = loanRepository.save(loan);

        auditLogService.record(
                "LOAN_" + updated.getStatus().name(),
                "LOAN_APPLICATION",
                updated.getId(),
                analyst,
                "Status changed from " + previousStatus + " to " + updated.getStatus() + ". Notes: " + request.reviewerNotes()
        );

        return LoanResponse.from(updated);
    }

    @Transactional(readOnly = true)
    public Page<LoanResponse> getAllLoans(LoanStatus status, Pageable pageable) {
        Page<LoanApplication> loans = (status != null)
                ? loanRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : loanRepository.findAllByOrderByCreatedAtDesc(pageable);
        return loans.map(LoanResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<LoanResponse> getMySubmittedLoans(User loanOfficer, Pageable pageable) {
        return loanRepository.findBySubmittedByIdOrderByCreatedAtDesc(loanOfficer.getId(), pageable)
                .map(LoanResponse::from);
    }

    @Transactional(readOnly = true)
    public LoanResponse getLoanById(Long loanId, User currentUser) {
        LoanApplication loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + loanId));

        // IDOR protection: Loan Officers and Borrowers can only view loans they submitted
        if ((currentUser.getRole() == Role.LOAN_OFFICER || currentUser.getRole() == Role.USER)
                && !loan.getSubmittedBy().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("You are not authorized to view another officer's loan application.");
        }

        return LoanResponse.from(loan);
    }
}
