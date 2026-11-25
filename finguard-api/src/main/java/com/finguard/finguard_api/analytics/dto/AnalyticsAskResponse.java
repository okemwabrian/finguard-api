package com.finguard.finguard_api.analytics.dto;

public record AnalyticsAskResponse(
        String answer,
        ChartSpec chart
) {}
