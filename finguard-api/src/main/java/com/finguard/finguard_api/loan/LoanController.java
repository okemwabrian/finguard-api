package com.finguard.finguard_api.loan;

import com.finguard.finguard_api.loan.dto.CreateLoanRequest;
import com.finguard.finguard_api.loan.dto.LoanResponse;
import com.finguard.finguard_api.loan.dto.ReviewLoanRequest;
import com.finguard.finguard_api.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<List<LoanResponse>> getMyLoans(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(loanService.getMySubmittedLoans(currentUser));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CREDIT_ANALYST', 'AUDITOR')")
    public ResponseEntity<List<LoanResponse>> getAllLoans(@RequestParam(required = false) LoanStatus status) {
        return ResponseEntity.ok(loanService.getAllLoans(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'AUDITOR')")
    public ResponseEntity<LoanResponse> getLoanById(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.getLoanById(id));
    }
}
