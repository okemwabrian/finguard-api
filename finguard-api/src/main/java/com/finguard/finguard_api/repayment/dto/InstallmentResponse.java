package com.finguard.finguard_api.repayment.dto;

import com.finguard.finguard_api.repayment.Installment;
import com.finguard.finguard_api.repayment.InstallmentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record InstallmentResponse(
        Long id,
        Integer installmentNumber,
        LocalDate dueDate,
        BigDecimal openingBalance,
        BigDecimal principalComponent,
        BigDecimal interestComponent,
        BigDecimal closingBalance,
        InstallmentStatus status,
        LocalDateTime paidAt,
        String paymentMethod,
        BigDecimal paidAmount
) {
    public static InstallmentResponse from(Installment inst) {
        return new InstallmentResponse(
                inst.getId(),
                inst.getInstallmentNumber(),
                inst.getDueDate(),
                inst.getOpeningBalance(),
                inst.getPrincipalComponent(),
                inst.getInterestComponent(),
                inst.getClosingBalance(),
                inst.getStatus(),
                inst.getPaidAt(),
                inst.getPaymentMethod(),
                inst.getPaidAmount()
        );
    }
}
