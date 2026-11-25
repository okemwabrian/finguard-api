package com.finguard.finguard_api.document;

import com.finguard.finguard_api.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class LoanDocumentController {

    private final LoanDocumentService loanDocumentService;

    @PostMapping(value = "/api/loans/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('BORROWER', 'USER', 'LOAN_OFFICER', 'ADMIN')")
    public ResponseEntity<DocumentResponse> uploadDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("docType") DocType docType,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(loanDocumentService.uploadDocument(id, file, docType, currentUser));
    }

    @GetMapping("/api/loans/{id}/documents")
    @PreAuthorize("hasAnyRole('BORROWER', 'USER', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'AUDITOR', 'ADMIN')")
    public ResponseEntity<List<DocumentResponse>> getDocuments(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(loanDocumentService.getDocumentsForLoan(id, currentUser));
    }

    @GetMapping("/api/loans/{loanId}/documents/{docId}/download")
    @PreAuthorize("hasAnyRole('BORROWER', 'USER', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'AUDITOR', 'ADMIN')")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long loanId,
            @PathVariable Long docId,
            @AuthenticationPrincipal User currentUser
    ) {
        LoanDocumentService.DocumentDownload download = loanDocumentService.loadDocumentForDownload(loanId, docId, currentUser);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + download.originalFilename() + "\"")
                .body(download.resource());
    }

    @PatchMapping("/api/documents/{id}/verify")
    @PreAuthorize("hasAnyRole('CREDIT_ANALYST', 'ADMIN')")
    public ResponseEntity<DocumentResponse> verifyDocument(
            @PathVariable Long id,
            @Valid @RequestBody VerifyDocumentRequest request,
            @AuthenticationPrincipal User currentUser
    ) {
        return ResponseEntity.ok(loanDocumentService.verifyDocument(id, request, currentUser));
    }
}
