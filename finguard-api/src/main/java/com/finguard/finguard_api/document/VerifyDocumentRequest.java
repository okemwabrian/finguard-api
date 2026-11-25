package com.finguard.finguard_api.document;

import jakarta.validation.constraints.NotNull;

public record VerifyDocumentRequest(
        @NotNull VerificationStatus status,
        String notes
) {}
