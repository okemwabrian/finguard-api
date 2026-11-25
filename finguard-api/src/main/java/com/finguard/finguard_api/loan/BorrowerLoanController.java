package com.finguard.finguard_api.loan;

import com.finguard.finguard_api.loan.dto.LoanResponse;
import com.finguard.finguard_api.repayment.RepaymentScheduleService;
import com.finguard.finguard_api.repayment.dto.ScheduleSummaryResponse;
import com.finguard.finguard_api.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/borrower/loans")
@PreAuthorize("hasAnyRole('BORROWER', 'USER')")
@RequiredArgsConstructor
public class BorrowerLoanController {

    private final LoanService loanService;
    private final RepaymentScheduleService repaymentScheduleService;

    @GetMapping
    public ResponseEntity<Page<LoanResponse>> getBorrowerLoans(
            @AuthenticationPrincipal User borrower,
            @PageableDefault(size = 15) Pageable pageable
    ) {
        return ResponseEntity.ok(loanService.getBorrowerLoans(borrower, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanResponse> getBorrowerLoanById(
            @PathVariable Long id,
            @AuthenticationPrincipal User borrower
    ) {
        return ResponseEntity.ok(loanService.getBorrowerLoanById(id, borrower));
    }

    @GetMapping("/{id}/schedule")
    public ResponseEntity<ScheduleSummaryResponse> getBorrowerSchedule(
            @PathVariable Long id,
            @AuthenticationPrincipal User borrower
    ) {
        return ResponseEntity.ok(repaymentScheduleService.getSchedule(id, borrower));
    }
}
