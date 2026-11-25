package com.finguard.finguard_api.document;

import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.loan.LoanApplication;
import com.finguard.finguard_api.loan.LoanRepository;
import com.finguard.finguard_api.loan.LoanStatus;
import com.finguard.finguard_api.notification.NotificationService;
import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanDocumentServiceTest {

    @Mock
    private LoanDocumentRepository loanDocumentRepository;

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private LoanDocumentService loanDocumentService;

    private User borrower;
    private User otherBorrower;
    private User analyst;
    private LoanApplication loan;

    @BeforeEach
    void setUp() {
        borrower = User.builder().id(1L).email("borrower@test.com").role(Role.BORROWER).build();
        otherBorrower = User.builder().id(2L).email("other@test.com").role(Role.BORROWER).build();
        analyst = User.builder().id(3L).email("analyst@finguard.com").role(Role.CREDIT_ANALYST).build();

        loan = LoanApplication.builder()
                .id(10L)
                .borrowerName("Jane Doe")
                .borrowerNationalId("12345678")
                .requestedAmount(new BigDecimal("50000.00"))
                .monthlyIncome(new BigDecimal("25000.00"))
                .existingMonthlyDebt(BigDecimal.ZERO)
                .repaymentMonths(6)
                .purpose("Expansion")
                .status(LoanStatus.PENDING)
                .submittedBy(borrower)
                .borrower(borrower)
                .build();
    }

    @Test
    void shouldUploadValidPdfDocument() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "payslip.pdf",
                "application/pdf",
                "PDF-CONTENT".getBytes()
        );

        when(loanRepository.findById(10L)).thenReturn(Optional.of(loan));
        when(loanDocumentRepository.save(any(LoanDocument.class))).thenAnswer(i -> {
            LoanDocument d = i.getArgument(0);
            d.setId(99L);
            return d;
        });

        DocumentResponse response = loanDocumentService.uploadDocument(10L, file, DocType.PAYSLIP, borrower);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(99L);
        assertThat(response.fileName()).isEqualTo("payslip.pdf");
        assertThat(response.docType()).isEqualTo(DocType.PAYSLIP);
        assertThat(response.verificationStatus()).isEqualTo(VerificationStatus.PENDING);

        verify(auditLogService, times(1)).record(eq("DOCUMENT_UPLOADED"), any(), eq(99L), eq(borrower), any());
    }

    @Test
    void shouldRejectUnsupportedFileExtension() {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file",
                "malware.exe",
                "application/octet-stream",
                "BINARY".getBytes()
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                loanDocumentService.uploadDocument(10L, exeFile, DocType.OTHER, borrower)
        );

        assertThat(ex.getMessage()).contains("only PDF, JPG, and PNG files are accepted");
    }

    @Test
    void shouldRejectFileSizeExceeding10MB() {
        byte[] largeBytes = new byte[11 * 1024 * 1024];
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "huge.pdf",
                "application/pdf",
                largeBytes
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                loanDocumentService.uploadDocument(10L, largeFile, DocType.BANK_STATEMENT, borrower)
        );

        assertThat(ex.getMessage()).contains("exceeds 10MB limit");
    }

    @Test
    void shouldEnforceIdorCheckWhenAnotherBorrowerUploads() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "payslip.pdf",
                "application/pdf",
                "PDF".getBytes()
        );

        when(loanRepository.findById(10L)).thenReturn(Optional.of(loan));

        assertThrows(AccessDeniedException.class, () ->
                loanDocumentService.uploadDocument(10L, file, DocType.PAYSLIP, otherBorrower)
        );
    }

    @Test
    void shouldVerifyDocumentSuccessfully() {
        LoanDocument document = LoanDocument.builder()
                .id(55L)
                .loanApplication(loan)
                .fileName("national_id.png")
                .docType(DocType.NATIONAL_ID)
                .verificationStatus(VerificationStatus.PENDING)
                .uploadedBy(borrower)
                .build();

        when(loanDocumentRepository.findById(55L)).thenReturn(Optional.of(document));
        when(loanDocumentRepository.save(any(LoanDocument.class))).thenAnswer(i -> i.getArgument(0));

        VerifyDocumentRequest request = new VerifyDocumentRequest(VerificationStatus.VERIFIED, "ID clear and verified with IPRS");
        DocumentResponse response = loanDocumentService.verifyDocument(55L, request, analyst);

        assertThat(response.verificationStatus()).isEqualTo(VerificationStatus.VERIFIED);
        assertThat(response.verificationNotes()).isEqualTo("ID clear and verified with IPRS");

        verify(auditLogService, times(1)).record(eq("DOCUMENT_VERIFIED"), any(), eq(55L), eq(analyst), any());
        verify(notificationService, times(1)).sendNotification(eq(borrower), any(), any(), any(), eq(10L));
    }
}
