package com.finguard.finguard_api.analytics.dto;

import java.util.List;

public record ChartSpec(
        String type,
        String title,
        List<String> labels,
        List<ChartSeries> series
) {}
