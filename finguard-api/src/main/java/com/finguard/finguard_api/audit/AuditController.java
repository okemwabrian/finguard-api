package com.finguard.finguard_api.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }

    @GetMapping("/loan/{loanId}")
    public ResponseEntity<List<AuditLog>> getLogsByLoan(@PathVariable Long loanId) {
        return ResponseEntity.ok(auditLogService.getLogsForEntity(loanId));
    }
}
