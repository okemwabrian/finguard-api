package com.finguard.finguard_api.report;

import com.finguard.finguard_api.user.User;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ReportsController {

    private final ReportsExportService reportsExportService;

    @GetMapping("/portfolio/export")
    public void exportPortfolio(
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response,
            @AuthenticationPrincipal User admin
    ) throws IOException {
        reportsExportService.exportPortfolio(format, response, admin);
    }

    @GetMapping("/audit/export")
    public void exportAudit(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String entityType,
            @RequestParam(defaultValue = "csv") String format,
            HttpServletResponse response,
            @AuthenticationPrincipal User admin
    ) throws IOException {
        reportsExportService.exportAudit(from, to, entityType, format, response, admin);
    }
}
