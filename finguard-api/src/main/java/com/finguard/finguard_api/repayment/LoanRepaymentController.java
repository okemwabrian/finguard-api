package com.finguard.finguard_api.repayment;

import com.finguard.finguard_api.loan.dto.LoanResponse;
import com.finguard.finguard_api.repayment.dto.InstallmentResponse;
import com.finguard.finguard_api.repayment.dto.RecordPaymentRequest;
import com.finguard.finguard_api.repayment.dto.ScheduleSummaryResponse;
import com.finguard.finguard_api.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LoanRepaymentController {

    private final RepaymentScheduleService repaymentScheduleService;

    @PostMapping("/api/loans/{id}/payments")
    @PreAuthorize("hasAnyRole('CREDIT_ANALYST', 'ADMIN', 'LOAN_OFFICER', 'USER', 'BORROWER')")
    public ResponseEntity<InstallmentResponse> recordPayment(
            @PathVariable Long id,
            @Valid @RequestBody RecordPaymentRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(repaymentScheduleService.recordPayment(id, request, currentUser));
    }

    @GetMapping("/api/loans/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'CREDIT_ANALYST', 'LOAN_OFFICER', 'AUDITOR', 'BORROWER', 'USER')")
    public ResponseEntity<Page<InstallmentResponse>> getPayments(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            @PageableDefault(size = 15) Pageable pageable
    ) {
        return ResponseEntity.ok(repaymentScheduleService.getPayments(id, currentUser, pageable));
    }

    @GetMapping("/api/loans/{id}/schedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'CREDIT_ANALYST', 'LOAN_OFFICER', 'AUDITOR')")
    public ResponseEntity<ScheduleSummaryResponse> getStaffSchedule(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(repaymentScheduleService.getSchedule(id, currentUser));
    }

    @GetMapping("/api/loans/delinquent")
    @PreAuthorize("hasAnyRole('ADMIN', 'CREDIT_ANALYST', 'LOAN_OFFICER', 'AUDITOR')")
    public ResponseEntity<Page<LoanResponse>> getDelinquentLoans(
            @PageableDefault(size = 15) Pageable pageable
    ) {
        return ResponseEntity.ok(repaymentScheduleService.getDelinquentLoans(pageable));
    }
}
