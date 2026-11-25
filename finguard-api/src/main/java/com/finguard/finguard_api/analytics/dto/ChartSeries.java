package com.finguard.finguard_api.analytics.dto;

import java.util.List;

public record ChartSeries(
        String name,
        List<Number> data
) {}
