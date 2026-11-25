package com.finguard.finguard_api.report;

import com.finguard.finguard_api.audit.AuditLog;
import com.finguard.finguard_api.audit.AuditLogRepository;
import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.loan.LoanApplication;
import com.finguard.finguard_api.loan.LoanRepository;
import com.finguard.finguard_api.loan.LoanStatus;
import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class ReportsExportServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ReportsExportService reportsExportService;

    private LoanApplication sampleLoan;
    private AuditLog sampleLog;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .email("admin@finguard.com")
                .fullName("Admin User")
                .role(Role.ADMIN)
                .build();

        sampleLoan = LoanApplication.builder()
                .id(101L)
                .borrowerName("Jane Doe")
                .borrowerNationalId("ID-992211")
                .monthlyIncome(BigDecimal.valueOf(120000))
                .existingMonthlyDebt(BigDecimal.valueOf(25000))
                .requestedAmount(BigDecimal.valueOf(500000))
                .repaymentMonths(24)
                .interestRate(BigDecimal.valueOf(12.0))
                .status(LoanStatus.APPROVED)
                .aiRiskLevel("LOW")
                .aiRiskScore(18)
                .submittedBy(testUser)
                .createdAt(LocalDateTime.now())
                .build();

        sampleLog = AuditLog.builder()
                .id(500L)
                .action("LOAN_APPROVED")
                .entityType("LoanApplication")
                .entityId(101L)
                .performedByEmail(testUser.getEmail())
                .performedByRole(testUser.getRole().name())
                .details("Loan 101 approved by Admin")
                .timestamp(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("writePortfolioCsv produces valid CSV with headers and loan data")
    void writePortfolioCsv_success() throws IOException {
        StringWriter writer = new StringWriter();
        PrintWriter printWriter = new PrintWriter(writer);

        reportsExportService.writePortfolioCsv(
                printWriter,
                List.of(sampleLoan),
                BigDecimal.valueOf(500000),
                1L,
                100.0,
                1L, 0L, 0L
        );

        String output = writer.toString();
        assertThat(output).contains("FINGUARD AI - PORTFOLIO SUMMARY REPORT");
        assertThat(output).contains("Total Origination Volume (KES)");
        assertThat(output).contains("Jane Doe");
        assertThat(output).contains("ID-992211");
        assertThat(output).contains("APPROVED");
        assertThat(output).contains("LOW");
    }

    @Test
    @DisplayName("writePortfolioPdf produces non-empty binary PDF output")
    void writePortfolioPdf_success() {
        ByteArrayOutputStream os = new ByteArrayOutputStream();

        reportsExportService.writePortfolioPdf(
                os,
                List.of(sampleLoan),
                BigDecimal.valueOf(500000),
                1L,
                100.0,
                1L, 0L, 0L
        );

        byte[] pdfBytes = os.toByteArray();
        assertThat(pdfBytes).isNotEmpty();
        // PDF magic number header "%PDF"
        assertThat(new String(pdfBytes, 0, 4)).isEqualTo("%PDF");
    }

    @Test
    @DisplayName("writeAuditCsv produces valid CSV with headers and audit trail")
    void writeAuditCsv_success() throws IOException {
        StringWriter writer = new StringWriter();
        PrintWriter printWriter = new PrintWriter(writer);

        reportsExportService.writeAuditCsv(printWriter, List.of(sampleLog));

        String output = writer.toString();
        assertThat(output).contains("FINGUARD AI - COMPLIANCE AUDIT TRAIL EXPORT");
        assertThat(output).contains("LOAN_APPROVED");
        assertThat(output).contains("LoanApplication");
        assertThat(output).contains("admin@finguard.com");
    }

    @Test
    @DisplayName("writeAuditPdf produces non-empty binary PDF output")
    void writeAuditPdf_success() {
        ByteArrayOutputStream os = new ByteArrayOutputStream();

        reportsExportService.writeAuditPdf(os, List.of(sampleLog));

        byte[] pdfBytes = os.toByteArray();
        assertThat(pdfBytes).isNotEmpty();
        assertThat(new String(pdfBytes, 0, 4)).isEqualTo("%PDF");
    }
}
