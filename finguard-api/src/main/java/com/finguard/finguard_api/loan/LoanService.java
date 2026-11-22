package com.finguard.finguard_api.loan;

import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.loan.dto.CreateLoanRequest;
import com.finguard.finguard_api.loan.dto.LoanResponse;
import com.finguard.finguard_api.loan.dto.ReviewLoanRequest;
import com.finguard.finguard_api.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final AuditLogService auditLogService;

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

        LoanApplication saved = loanRepository.save(loan);

        auditLogService.record(
                "LOAN_CREATED",
                "LOAN_APPLICATION",
                saved.getId(),
                loanOfficer,
                "Submitted loan for " + saved.getBorrowerName() + " amounting to " + saved.getRequestedAmount()
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
    public List<LoanResponse> getAllLoans(LoanStatus status) {
        List<LoanApplication> loans = (status != null)
                ? loanRepository.findByStatusOrderByCreatedAtDesc(status)
                : loanRepository.findAllByOrderByCreatedAtDesc();
        return loans.stream().map(LoanResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<LoanResponse> getMySubmittedLoans(User loanOfficer) {
        return loanRepository.findBySubmittedByIdOrderByCreatedAtDesc(loanOfficer.getId())
                .stream()
                .map(LoanResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public LoanResponse getLoanById(Long loanId) {
        LoanApplication loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + loanId));
        return LoanResponse.from(loan);
    }
}
