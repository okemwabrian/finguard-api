package com.finguard.finguard_api.analytics.dto;

import jakarta.validation.constraints.NotBlank;

public record AskAnalyticsRequest(
        @NotBlank String question
) {}
