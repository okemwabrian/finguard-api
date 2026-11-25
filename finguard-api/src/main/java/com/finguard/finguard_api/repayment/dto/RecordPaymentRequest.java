package com.finguard.finguard_api.repayment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecordPaymentRequest(
        @NotNull @DecimalMin("1.00") BigDecimal amount,
        @Min(1) Integer installmentNumber,
        LocalDate paymentDate,
        String method
) {}
