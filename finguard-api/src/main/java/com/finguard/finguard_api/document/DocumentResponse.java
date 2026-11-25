package com.finguard.finguard_api.document;

import java.time.LocalDateTime;

public record DocumentResponse(
        Long id,
        Long loanId,
        String fileName,
        DocType docType,
        String mimeType,
        Long sizeBytes,
        String uploadedByEmail,
        VerificationStatus verificationStatus,
        String verificationNotes,
        String verifiedByEmail,
        LocalDateTime verifiedAt,
        LocalDateTime createdDate
) {
    public static DocumentResponse from(LoanDocument doc) {
        return new DocumentResponse(
                doc.getId(),
                doc.getLoanApplication().getId(),
                doc.getFileName(),
                doc.getDocType(),
                doc.getMimeType(),
                doc.getSizeBytes(),
                doc.getUploadedBy().getEmail(),
                doc.getVerificationStatus(),
                doc.getVerificationNotes(),
                doc.getVerifiedBy() != null ? doc.getVerifiedBy().getEmail() : null,
                doc.getVerifiedAt(),
                doc.getCreatedDate()
        );
    }
}
