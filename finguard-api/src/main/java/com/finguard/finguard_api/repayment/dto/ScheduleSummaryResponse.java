package com.finguard.finguard_api.repayment.dto;

import com.finguard.finguard_api.repayment.RepaymentSchedule;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ScheduleSummaryResponse(
        Long loanId,
        BigDecimal principal,
        BigDecimal annualInterestRate,
        Integer termMonths,
        BigDecimal monthlyPayment,
        BigDecimal totalInterest,
        BigDecimal totalRepayment,
        LocalDateTime generatedAt,
        long paidCount,
        long totalCount,
        LocalDate nextDueDate,
        BigDecimal outstandingBalance,
        BigDecimal totalPaid,
        List<InstallmentResponse> installments
) {}
