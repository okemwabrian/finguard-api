package com.finguard.finguard_api.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit-logs")
@PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<Page<AuditLog>> getAllAuditLogs(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(auditLogService.getAllLogs(pageable));
    }

    @GetMapping("/loan/{loanId}")
    public ResponseEntity<Page<AuditLog>> getLogsByLoan(
            @PathVariable Long loanId,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(auditLogService.getLogsForEntity(loanId, pageable));
    }
}
