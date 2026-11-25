package com.finguard.finguard_api.analytics;

import com.finguard.finguard_api.analytics.dto.AnalyticsAskResponse;
import com.finguard.finguard_api.analytics.dto.AskAnalyticsRequest;
import com.finguard.finguard_api.loan.LoanService;
import com.finguard.finguard_api.loan.dto.LoanStatsResponse;
import com.finguard.finguard_api.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@PreAuthorize("hasAnyRole('ADMIN', 'CREDIT_ANALYST', 'LOAN_OFFICER')")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final LoanService loanService;

    @PostMapping("/ask")
    public ResponseEntity<AnalyticsAskResponse> askAnalytics(
            @Valid @RequestBody AskAnalyticsRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(analyticsService.ask(request.question(), currentUser));
    }

    @GetMapping("/summary")
    public ResponseEntity<LoanStatsResponse> getAnalyticsSummary(
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(loanService.getLoanStats(currentUser));
    }
}
