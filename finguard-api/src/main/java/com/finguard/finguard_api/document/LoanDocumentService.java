package com.finguard.finguard_api.document;

import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.loan.LoanApplication;
import com.finguard.finguard_api.loan.LoanRepository;
import com.finguard.finguard_api.notification.NotificationService;
import com.finguard.finguard_api.notification.NotificationType;
import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoanDocumentService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".pdf", ".jpg", ".jpeg", ".png");
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/jpg"
    );

    private final LoanDocumentRepository loanDocumentRepository;
    private final LoanRepository loanRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Value("${file.upload.dir:./uploads/documents}")
    private String uploadDir = "./uploads/documents";

    @Transactional
    public DocumentResponse uploadDocument(Long loanId, MultipartFile file, DocType docType, User currentUser) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Upload failed: file cannot be empty.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Upload failed: file size exceeds 10MB limit.");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String extension = getFileExtension(originalFilename).toLowerCase();

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Upload failed: only PDF, JPG, and PNG files are accepted.");
        }

        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            // Fallback check by extension if browser passed generic binary stream
            if (extension.equals(".pdf")) mimeType = "application/pdf";
            else if (extension.equals(".png")) mimeType = "image/png";
            else mimeType = "image/jpeg";
        }

        LoanApplication loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + loanId));

        validateUploadAccess(loan, currentUser);

        try {
            Path storageDirectory = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(storageDirectory);

            String safeStorageName = UUID.randomUUID() + "_" + System.currentTimeMillis() + extension;
            Path targetPath = storageDirectory.resolve(safeStorageName);
            Files.copy(file.getInputStream(), targetPath);

            LoanDocument document = LoanDocument.builder()
                    .loanApplication(loan)
                    .fileName(originalFilename)
                    .storagePath(targetPath.toString())
                    .docType(docType != null ? docType : DocType.OTHER)
                    .mimeType(mimeType)
                    .sizeBytes(file.getSize())
                    .uploadedBy(currentUser)
                    .verificationStatus(VerificationStatus.PENDING)
                    .build();

            LoanDocument saved = loanDocumentRepository.save(document);

            auditLogService.record(
                    "DOCUMENT_UPLOADED",
                    "LOAN_DOCUMENT",
                    saved.getId(),
                    currentUser,
                    "Uploaded " + docType + " (" + originalFilename + ") for Loan #" + loanId
            );

            return DocumentResponse.from(saved);
        } catch (IOException ex) {
            log.error("Failed to store uploaded document: ", ex);
            throw new IllegalStateException("Failed to store file securely. Please retry.");
        }
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsForLoan(Long loanId, User currentUser) {
        LoanApplication loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + loanId));

        validateViewAccess(loan, currentUser);

        return loanDocumentRepository.findByLoanApplicationIdOrderByCreatedDateDesc(loanId)
                .stream()
                .map(DocumentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentDownload loadDocumentForDownload(Long loanId, Long docId, User currentUser) {
        LoanApplication loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + loanId));

        validateViewAccess(loan, currentUser);

        LoanDocument document = loanDocumentRepository.findById(docId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + docId));

        if (!document.getLoanApplication().getId().equals(loanId)) {
            throw new IllegalArgumentException("Document does not belong to the specified loan.");
        }

        Path filePath = Paths.get(document.getStoragePath());
        if (!Files.exists(filePath)) {
            throw new IllegalArgumentException("Stored document file could not be found.");
        }

        Resource resource = new FileSystemResource(filePath);
        return new DocumentDownload(resource, document.getFileName(), document.getMimeType());
    }

    @Transactional
    public DocumentResponse verifyDocument(Long docId, VerifyDocumentRequest request, User analyst) {
        LoanDocument document = loanDocumentRepository.findById(docId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + docId));

        document.setVerificationStatus(request.status());
        document.setVerificationNotes(request.notes());
        document.setVerifiedBy(analyst);
        document.setVerifiedAt(LocalDateTime.now());

        LoanDocument saved = loanDocumentRepository.save(document);

        String action = request.status() == VerificationStatus.VERIFIED ? "DOCUMENT_VERIFIED" : "DOCUMENT_REJECTED";
        auditLogService.record(
                action,
                "LOAN_DOCUMENT",
                saved.getId(),
                analyst,
                "Document " + saved.getFileName() + " (" + saved.getDocType() + ") marked " + request.status()
                        + (request.notes() != null ? ". Notes: " + request.notes() : "")
        );

        User borrower = saved.getLoanApplication().getBorrower() != null
                ? saved.getLoanApplication().getBorrower()
                : saved.getLoanApplication().getSubmittedBy();

        notificationService.sendNotification(
                borrower,
                NotificationType.DOCUMENT_VERIFIED,
                "Document " + request.status(),
                "Your document (" + saved.getDocType() + ") was marked " + request.status() + (request.notes() != null ? ": " + request.notes() : ""),
                saved.getLoanApplication().getId()
        );

        return DocumentResponse.from(saved);
    }

    private void validateUploadAccess(LoanApplication loan, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return;
        }
        if (currentUser.getRole() == Role.BORROWER || currentUser.getRole() == Role.USER) {
            boolean isOwner = (loan.getBorrower() != null && loan.getBorrower().getId().equals(currentUser.getId()))
                    || loan.getSubmittedBy().getId().equals(currentUser.getId());
            if (!isOwner) {
                throw new AccessDeniedException("You are not authorized to upload documents for this loan.");
            }
            return;
        }
        if (currentUser.getRole() == Role.LOAN_OFFICER) {
            if (!loan.getSubmittedBy().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Officers can only upload documents to their own submissions.");
            }
            return;
        }
        throw new AccessDeniedException("You do not have permission to upload documents.");
    }

    private void validateViewAccess(LoanApplication loan, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.CREDIT_ANALYST || currentUser.getRole() == Role.AUDITOR) {
            return;
        }
        boolean isOwner = (loan.getBorrower() != null && loan.getBorrower().getId().equals(currentUser.getId()))
                || loan.getSubmittedBy().getId().equals(currentUser.getId());
        if (!isOwner) {
            throw new AccessDeniedException("You are not authorized to view documents for this loan.");
        }
    }

    private String getFileExtension(String filename) {
        int index = filename.lastIndexOf('.');
        return index > 0 ? filename.substring(index) : "";
    }

    public record DocumentDownload(Resource resource, String originalFilename, String mimeType) {}
}
