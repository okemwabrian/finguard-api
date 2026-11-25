package com.finguard.finguard_api.email;

public record BulkEmailResponse(int sent, int failed, int skipped, String message) {
}
