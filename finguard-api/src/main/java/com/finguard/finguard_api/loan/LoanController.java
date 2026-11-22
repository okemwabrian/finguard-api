package com.finguard.finguard_api.loan;

import com.finguard.finguard_api.loan.dto.CreateLoanRequest;
import com.finguard.finguard_api.loan.dto.LoanResponse;
import com.finguard.finguard_api.loan.dto.ReviewLoanRequest;
import com.finguard.finguard_api.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping
    @PreAuthorize("hasRole('LOAN_OFFICER')")
    public ResponseEntity<LoanResponse> submitLoan(
            @Valid @RequestBody CreateLoanRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(loanService.submitLoan(request, currentUser));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('CREDIT_ANALYST')")
    public ResponseEntity<LoanResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReviewLoanRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(loanService.updateLoanStatus(id, request, currentUser));
    }

    @GetMapping("/my-submissions")
    @PreAuthorize("hasRole('LOAN_OFFICER')")
    public ResponseEntity<Page<LoanResponse>> getMyLoans(
            @AuthenticationPrincipal User currentUser,
            @PageableDefault(size = 15) Pageable pageable
    ) {
        return ResponseEntity.ok(loanService.getMySubmittedLoans(currentUser, pageable));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CREDIT_ANALYST', 'AUDITOR')")
    public ResponseEntity<Page<LoanResponse>> getAllLoans(
            @RequestParam(required = false) LoanStatus status,
            @PageableDefault(size = 15) Pageable pageable
    ) {
        return ResponseEntity.ok(loanService.getAllLoans(status, pageable));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'AUDITOR')")
    public ResponseEntity<LoanResponse> getLoanById(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(loanService.getLoanById(id, currentUser));
    }
}
