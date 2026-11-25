package com.finguard.finguard_api.loan;

import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.config.CacheConfig;
import com.finguard.finguard_api.loan.dto.LoanResponse;
import com.finguard.finguard_api.notification.NotificationService;
import com.finguard.finguard_api.notification.NotificationType;
import com.finguard.finguard_api.repayment.RepaymentScheduleService;
import com.finguard.finguard_api.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/admin/loans")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminLoanController {

    private final LoanRepository loanRepository;
    private final AuditLogService auditLogService;
    private final RepaymentScheduleService repaymentScheduleService;
    private final NotificationService notificationService;

    public record AdminLoanUpdateRequest(
            BigDecimal requestedAmount,
            Integer repaymentMonths,
            BigDecimal interestRate,
            String purpose,
            LoanStatus status,
            String reviewerNotes
    ) {}

    @PutMapping("/{id}")
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.CACHE_LOANS, allEntries = true),
            @CacheEvict(value = CacheConfig.CACHE_MY_LOANS, allEntries = true),
            @CacheEvict(value = CacheConfig.CACHE_LOAN_DETAILS, allEntries = true),
            @CacheEvict(value = CacheConfig.CACHE_LOAN_STATS, allEntries = true)
    })
    public ResponseEntity<LoanResponse> adminUpdateLoan(
            @PathVariable Long id,
            @RequestBody AdminLoanUpdateRequest request,
            @AuthenticationPrincipal User admin
    ) {
        LoanApplication loan = loanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + id));

        if (request.requestedAmount() != null) {
            loan.setRequestedAmount(request.requestedAmount());
        }
        if (request.repaymentMonths() != null) {
            loan.setRepaymentMonths(request.repaymentMonths());
            loan.setTermMonths(request.repaymentMonths());
        }
        if (request.interestRate() != null) {
            loan.setInterestRate(request.interestRate());
        }
        if (request.purpose() != null && !request.purpose().isBlank()) {
            loan.setPurpose(request.purpose().trim());
        }
        if (request.reviewerNotes() != null) {
            loan.setReviewerNotes(request.reviewerNotes());
        }

        LoanStatus previousStatus = loan.getStatus();
        if (request.status() != null && request.status() != previousStatus) {
            loan.setStatus(request.status());
            loan.setReviewedBy(admin);
            if (request.status() == LoanStatus.APPROVED) {
                repaymentScheduleService.generateSchedule(loan);
            }
        }

        LoanApplication saved = loanRepository.save(loan);

        auditLogService.record(
                "LOAN_ADMIN_UPDATED",
                "LOAN_APPLICATION",
                saved.getId(),
                admin,
                "Admin updated loan #" + saved.getId() + " (Amount: " + saved.getRequestedAmount()
                        + ", Rate: " + saved.getInterestRate() + "%, Status: " + saved.getStatus() + ")"
        );

        User recipient = saved.getBorrower() != null ? saved.getBorrower() : saved.getSubmittedBy();
        notificationService.sendNotification(
                recipient,
                NotificationType.LOAN_STATUS_CHANGED,
                "Loan #" + saved.getId() + " Updated",
                "An administrator updated your loan application #" + saved.getId() + " (Status: " + saved.getStatus() + ").",
                saved.getId()
        );

        return ResponseEntity.ok(LoanResponse.from(saved));
    }
}
