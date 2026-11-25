package com.finguard.finguard_api.report;

import com.finguard.finguard_api.audit.AuditLog;
import com.finguard.finguard_api.audit.AuditLogRepository;
import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.loan.LoanApplication;
import com.finguard.finguard_api.loan.LoanRepository;
import com.finguard.finguard_api.loan.LoanStatus;
import com.finguard.finguard_api.user.User;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportsExportService {

    private final LoanRepository loanRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;

    private static final DateTimeFormatter TS_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    private static final DateTimeFormatter DISPLAY_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Transactional(readOnly = true)
    public void exportPortfolio(String format, HttpServletResponse response, User admin) throws IOException {
        List<LoanApplication> loans = loanRepository.findAllByOrderByCreatedAtDesc(Pageable.unpaged()).getContent();

        BigDecimal totalVolume = loans.stream()
                .map(LoanApplication::getRequestedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalCount = loans.size();
        long approvedCount = loans.stream().filter(l -> l.getStatus() == LoanStatus.APPROVED).count();
        double approvalRate = totalCount > 0 ? (approvedCount * 100.0) / totalCount : 0.0;

        long lowRisk = loans.stream().filter(l -> "LOW".equalsIgnoreCase(l.getAiRiskLevel())).count();
        long medRisk = loans.stream().filter(l -> "MEDIUM".equalsIgnoreCase(l.getAiRiskLevel())).count();
        long highRisk = loans.stream().filter(l -> "HIGH".equalsIgnoreCase(l.getAiRiskLevel())).count();

        String timestamp = LocalDateTime.now().format(TS_FORMAT);

        if ("pdf".equalsIgnoreCase(format)) {
            String filename = "finguard-portfolio-report-" + timestamp + ".pdf";
            response.setContentType("application/pdf");
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
            writePortfolioPdf(response.getOutputStream(), loans, totalVolume, totalCount, approvalRate, lowRisk, medRisk, highRisk);
        } else {
            String filename = "finguard-portfolio-report-" + timestamp + ".csv";
            response.setContentType("text/csv; charset=UTF-8");
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
            writePortfolioCsv(response.getWriter(), loans, totalVolume, totalCount, approvalRate, lowRisk, medRisk, highRisk);
        }

        auditLogService.record(
                "REPORT_EXPORTED",
                "PORTFOLIO_REPORT",
                0L,
                admin,
                "Exported portfolio report in " + format.toUpperCase() + " format (" + totalCount + " records)"
        );
    }

    @Transactional(readOnly = true)
    public void exportAudit(LocalDateTime from, LocalDateTime to, String entityType, String format, HttpServletResponse response, User admin) throws IOException {
        List<AuditLog> logs = auditLogRepository.findFiltered(from, to, (entityType != null && !entityType.isBlank()) ? entityType : null);
        String timestamp = LocalDateTime.now().format(TS_FORMAT);

        if ("pdf".equalsIgnoreCase(format)) {
            String filename = "finguard-audit-report-" + timestamp + ".pdf";
            response.setContentType("application/pdf");
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
            writeAuditPdf(response.getOutputStream(), logs);
        } else {
            String filename = "finguard-audit-report-" + timestamp + ".csv";
            response.setContentType("text/csv; charset=UTF-8");
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
            writeAuditCsv(response.getWriter(), logs);
        }

        auditLogService.record(
                "REPORT_EXPORTED",
                "AUDIT_REPORT",
                0L,
                admin,
                "Exported audit logs in " + format.toUpperCase() + " format (" + logs.size() + " records)"
        );
    }

    public void writePortfolioCsv(PrintWriter writer, List<LoanApplication> loans, BigDecimal totalVolume, long totalCount, double approvalRate, long lowRisk, long medRisk, long highRisk) throws IOException {
        CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT);

        csvPrinter.printRecord("FINGUARD - PORTFOLIO SUMMARY REPORT");
        csvPrinter.printRecord("Generated At", LocalDateTime.now().format(DISPLAY_FORMAT));
        csvPrinter.printRecord("Total Origination Volume (KES)", totalVolume);
        csvPrinter.printRecord("Total Applications", totalCount);
        csvPrinter.printRecord("Approval Rate (%)", String.format("%.1f%%", approvalRate));
        csvPrinter.printRecord("Risk Breakdown", String.format("LOW: %d, MEDIUM: %d, HIGH: %d", lowRisk, medRisk, highRisk));
        csvPrinter.println();

        csvPrinter.printRecord("Loan ID", "Borrower Name", "National ID", "Income (KES)", "Debt (KES)", "Requested Amount (KES)", "Term (Months)", "Status", "AI Risk Level", "AI Risk Score", "Submitted By", "Created At");

        for (LoanApplication loan : loans) {
            csvPrinter.printRecord(
                    loan.getId(),
                    loan.getBorrowerName(),
                    loan.getBorrowerNationalId(),
                    loan.getMonthlyIncome(),
                    loan.getExistingMonthlyDebt(),
                    loan.getRequestedAmount(),
                    loan.getRepaymentMonths(),
                    loan.getStatus(),
                    loan.getAiRiskLevel() != null ? loan.getAiRiskLevel() : "N/A",
                    loan.getAiRiskScore() != null ? loan.getAiRiskScore() : "—",
                    loan.getSubmittedBy().getEmail(),
                    loan.getCreatedAt() != null ? loan.getCreatedAt().format(DISPLAY_FORMAT) : ""
            );
        }
        csvPrinter.flush();
    }

    public void writePortfolioPdf(OutputStream os, List<LoanApplication> loans, BigDecimal totalVolume, long totalCount, double approvalRate, long lowRisk, long medRisk, long highRisk) {
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
        PdfWriter.getInstance(document, os);
        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(30, 27, 75));
        Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
        Font boldHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.BLACK);

        Paragraph title = new Paragraph("FinGuard AI — Portfolio Underwriting Report", titleFont);
        Paragraph subtitle = new Paragraph("Generated on " + LocalDateTime.now().format(DISPLAY_FORMAT) + " | Confidential Bank Audit Document", subFont);
        subtitle.setSpacingAfter(12);

        document.add(title);
        document.add(subtitle);

        // Summary KPI Box
        PdfPTable summaryTable = new PdfPTable(4);
        summaryTable.setWidthPercentage(100);
        summaryTable.setSpacingAfter(15);

        addKpiCell(summaryTable, "Total Volume", "KES " + totalVolume.toPlainString());
        addKpiCell(summaryTable, "Applications", String.valueOf(totalCount));
        addKpiCell(summaryTable, "Approval Rate", String.format("%.1f%%", approvalRate));
        addKpiCell(summaryTable, "Risk Breakdown", String.format("L:%d / M:%d / H:%d", lowRisk, medRisk, highRisk));
        document.add(summaryTable);

        // Loans Table
        PdfPTable table = new PdfPTable(9);
        table.setWidthPercentage(100);

        String[] headers = {"ID", "Borrower", "National ID", "Income", "Amount", "Term", "Status", "AI Risk", "Created"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, boldHeader));
            cell.setBackgroundColor(new Color(30, 27, 75));
            cell.setPadding(6);
            table.addCell(cell);
        }

        for (LoanApplication l : loans) {
            table.addCell(new Phrase("#" + l.getId(), cellFont));
            table.addCell(new Phrase(l.getBorrowerName(), cellFont));
            table.addCell(new Phrase(l.getBorrowerNationalId(), cellFont));
            table.addCell(new Phrase(l.getMonthlyIncome().toPlainString(), cellFont));
            table.addCell(new Phrase("KES " + l.getRequestedAmount().toPlainString(), cellFont));
            table.addCell(new Phrase(l.getRepaymentMonths() + " mos", cellFont));
            table.addCell(new Phrase(l.getStatus().name(), cellFont));
            table.addCell(new Phrase((l.getAiRiskLevel() != null ? l.getAiRiskLevel() : "N/A") + " (" + (l.getAiRiskScore() != null ? l.getAiRiskScore() : "—") + ")", cellFont));
            table.addCell(new Phrase(l.getCreatedAt() != null ? l.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) : "", cellFont));
        }

        document.add(table);
        document.close();
    }

    public void writeAuditCsv(PrintWriter writer, List<AuditLog> logs) throws IOException {
        CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT);
        csvPrinter.printRecord("FINGUARD AI - COMPLIANCE AUDIT TRAIL EXPORT");
        csvPrinter.printRecord("Generated At", LocalDateTime.now().format(DISPLAY_FORMAT));
        csvPrinter.printRecord("Total Records", logs.size());
        csvPrinter.println();

        csvPrinter.printRecord("Log ID", "Timestamp", "Action", "Entity Type", "Entity ID", "Performed By", "Role", "Details");

        for (AuditLog log : logs) {
            csvPrinter.printRecord(
                    log.getId(),
                    log.getTimestamp() != null ? log.getTimestamp().format(DISPLAY_FORMAT) : "",
                    log.getAction(),
                    log.getEntityType(),
                    log.getEntityId(),
                    log.getPerformedByEmail(),
                    log.getPerformedByRole(),
                    log.getDetails()
            );
        }
        csvPrinter.flush();
    }

    public void writeAuditPdf(OutputStream os, List<AuditLog> logs) {
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
        PdfWriter.getInstance(document, os);
        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, new Color(30, 27, 75));
        Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
        Font boldHeader = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
        Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.BLACK);

        Paragraph title = new Paragraph("FinGuard AI — Compliance Audit Trail Report", titleFont);
        Paragraph subtitle = new Paragraph("Generated on " + LocalDateTime.now().format(DISPLAY_FORMAT) + " | Immutable Regulatory Record", subFont);
        subtitle.setSpacingAfter(15);

        document.add(title);
        document.add(subtitle);

        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);

        String[] headers = {"Log ID", "Timestamp", "Action", "Entity", "User", "Role", "Details"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, boldHeader));
            cell.setBackgroundColor(new Color(30, 27, 75));
            cell.setPadding(6);
            table.addCell(cell);
        }

        for (AuditLog log : logs) {
            table.addCell(new Phrase("#" + log.getId(), cellFont));
            table.addCell(new Phrase(log.getTimestamp() != null ? log.getTimestamp().format(DISPLAY_FORMAT) : "", cellFont));
            table.addCell(new Phrase(log.getAction(), cellFont));
            table.addCell(new Phrase(log.getEntityType() + " #" + log.getEntityId(), cellFont));
            table.addCell(new Phrase(log.getPerformedByEmail(), cellFont));
            table.addCell(new Phrase(log.getPerformedByRole(), cellFont));
            table.addCell(new Phrase(log.getDetails(), cellFont));
        }

        document.add(table);
        document.close();
    }

    private void addKpiCell(PdfPTable table, String label, String value) {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);
        Font valFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, new Color(30, 27, 75));
        PdfPCell cell = new PdfPCell();
        cell.setPadding(8);
        cell.setBackgroundColor(new Color(248, 250, 252));
        cell.addElement(new Paragraph(label, labelFont));
        cell.addElement(new Paragraph(value, valFont));
        table.addCell(cell);
    }
}
