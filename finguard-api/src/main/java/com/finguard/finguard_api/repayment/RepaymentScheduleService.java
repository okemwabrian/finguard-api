package com.finguard.finguard_api.repayment;

import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.loan.LoanApplication;
import com.finguard.finguard_api.loan.LoanRepository;
import com.finguard.finguard_api.loan.dto.LoanResponse;
import com.finguard.finguard_api.notification.NotificationService;
import com.finguard.finguard_api.notification.NotificationType;
import com.finguard.finguard_api.repayment.dto.InstallmentResponse;
import com.finguard.finguard_api.repayment.dto.RecordPaymentRequest;
import com.finguard.finguard_api.repayment.dto.ScheduleSummaryResponse;
import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RepaymentScheduleService {

    private final RepaymentScheduleRepository scheduleRepository;
    private final InstallmentRepository installmentRepository;
    private final LoanRepository loanRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional
    public RepaymentSchedule generateSchedule(LoanApplication loan) {
        scheduleRepository.findByLoanApplicationId(loan.getId())
                .ifPresent(existing -> {
                    log.info("Deleting existing repayment schedule for Loan #{}", loan.getId());
                    scheduleRepository.delete(existing);
                });

        BigDecimal principal = loan.getRequestedAmount();
        int term = loan.getTermMonths() != null ? loan.getTermMonths() : loan.getRepaymentMonths();
        BigDecimal annualRate = loan.getInterestRate() != null ? loan.getInterestRate() : new BigDecimal("12.00");

        BigDecimal monthlyRate = annualRate.divide(BigDecimal.valueOf(1200), 8, RoundingMode.HALF_UP);

        BigDecimal monthlyPayment;
        if (monthlyRate.compareTo(BigDecimal.ZERO) == 0) {
            monthlyPayment = principal.divide(BigDecimal.valueOf(term), 2, RoundingMode.HALF_UP);
        } else {
            // M = P * [r(1+r)^n] / [(1+r)^n - 1]
            BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
            BigDecimal onePlusRPowN = onePlusR.pow(term);
            BigDecimal numerator = principal.multiply(monthlyRate).multiply(onePlusRPowN);
            BigDecimal denominator = onePlusRPowN.subtract(BigDecimal.ONE);
            monthlyPayment = numerator.divide(denominator, 2, RoundingMode.HALF_UP);
        }

        RepaymentSchedule schedule = RepaymentSchedule.builder()
                .loanApplication(loan)
                .principal(principal)
                .annualInterestRate(annualRate)
                .termMonths(term)
                .monthlyPayment(monthlyPayment)
                .generatedAt(LocalDateTime.now())
                .build();

        List<Installment> installments = new ArrayList<>();
        BigDecimal currentBalance = principal;
        BigDecimal calculatedTotalInterest = BigDecimal.ZERO;
        BigDecimal calculatedTotalRepayment = BigDecimal.ZERO;

        LocalDate today = LocalDate.now();

        for (int i = 1; i <= term; i++) {
            LocalDate dueDate = today.plusMonths(i);
            BigDecimal interest = currentBalance.multiply(monthlyRate).setScale(2, RoundingMode.HALF_UP);
            BigDecimal principalComp = monthlyPayment.subtract(interest);

            if (i == term || currentBalance.subtract(principalComp).compareTo(BigDecimal.ZERO) < 0) {
                // Final installment closes exactly to zero
                principalComp = currentBalance;
            }

            BigDecimal closingBalance = currentBalance.subtract(principalComp).setScale(2, RoundingMode.HALF_UP);
            if (closingBalance.compareTo(BigDecimal.ZERO) < 0) {
                closingBalance = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            }

            InstallmentStatus status = (i == 1) ? InstallmentStatus.DUE : InstallmentStatus.UPCOMING;

            Installment installment = Installment.builder()
                    .schedule(schedule)
                    .installmentNumber(i)
                    .dueDate(dueDate)
                    .openingBalance(currentBalance.setScale(2, RoundingMode.HALF_UP))
                    .principalComponent(principalComp.setScale(2, RoundingMode.HALF_UP))
                    .interestComponent(interest.setScale(2, RoundingMode.HALF_UP))
                    .closingBalance(closingBalance)
                    .status(status)
                    .build();

            installments.add(installment);

            calculatedTotalInterest = calculatedTotalInterest.add(interest);
            calculatedTotalRepayment = calculatedTotalRepayment.add(principalComp).add(interest);
            currentBalance = closingBalance;
        }

        schedule.setInstallments(installments);
        schedule.setTotalInterest(calculatedTotalInterest.setScale(2, RoundingMode.HALF_UP));
        schedule.setTotalRepayment(calculatedTotalRepayment.setScale(2, RoundingMode.HALF_UP));

        return scheduleRepository.save(schedule);
    }

    @Transactional
    public InstallmentResponse recordPayment(Long loanId, RecordPaymentRequest request, User actor) {
        LoanApplication loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + loanId));

        Installment installment = installmentRepository.findByScheduleLoanApplicationIdAndInstallmentNumber(loanId, request.installmentNumber())
                .orElseThrow(() -> new IllegalArgumentException("Installment #" + request.installmentNumber() + " not found for loan: " + loanId));

        if (installment.getStatus() == InstallmentStatus.PAID) {
            throw new IllegalStateException("Installment #" + request.installmentNumber() + " is already marked as PAID.");
        }

        installment.setStatus(InstallmentStatus.PAID);
        installment.setPaidAt(request.paymentDate() != null ? request.paymentDate().atStartOfDay() : LocalDateTime.now());
        installment.setPaymentMethod(request.method() != null ? request.method() : "MANUAL");
        installment.setPaidAmount(request.amount());

        Installment saved = installmentRepository.save(installment);

        auditLogService.record(
                "PAYMENT_RECORDED",
                "LOAN_INSTALLMENT",
                saved.getId(),
                actor,
                "Recorded payment of KES " + request.amount() + " for Loan #" + loanId + ", installment #" + request.installmentNumber()
        );

        User borrower = loan.getBorrower() != null ? loan.getBorrower() : loan.getSubmittedBy();
        notificationService.sendNotification(
                borrower,
                NotificationType.PAYMENT_RECORDED,
                "Payment Recorded",
                "Payment of KES " + request.amount() + " recorded for installment #" + request.installmentNumber() + " of Loan #" + loanId,
                loanId
        );

        return InstallmentResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public ScheduleSummaryResponse getSchedule(Long loanId, User currentUser) {
        LoanApplication loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + loanId));

        validateScheduleAccess(loan, currentUser);

        RepaymentSchedule schedule = scheduleRepository.findByLoanApplicationId(loanId)
                .orElseThrow(() -> new IllegalArgumentException("No repayment schedule generated for loan: " + loanId));

        List<Installment> installments = schedule.getInstallments();
        long paidCount = installments.stream().filter(i -> i.getStatus() == InstallmentStatus.PAID).count();
        LocalDate nextDueDate = installments.stream()
                .filter(i -> i.getStatus() != InstallmentStatus.PAID)
                .map(Installment::getDueDate)
                .findFirst()
                .orElse(null);

        BigDecimal outstandingBalance = installments.stream()
                .filter(i -> i.getStatus() != InstallmentStatus.PAID)
                .map(Installment::getPrincipalComponent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = installments.stream()
                .filter(i -> i.getStatus() == InstallmentStatus.PAID)
                .map(i -> i.getPaidAmount() != null ? i.getPaidAmount() : i.getPrincipalComponent().add(i.getInterestComponent()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<InstallmentResponse> installmentResponses = installments.stream()
                .map(InstallmentResponse::from)
                .toList();

        return new ScheduleSummaryResponse(
                loanId,
                schedule.getPrincipal(),
                schedule.getAnnualInterestRate(),
                schedule.getTermMonths(),
                schedule.getMonthlyPayment(),
                schedule.getTotalInterest(),
                schedule.getTotalRepayment(),
                schedule.getGeneratedAt(),
                paidCount,
                installments.size(),
                nextDueDate,
                outstandingBalance.setScale(2, RoundingMode.HALF_UP),
                totalPaid.setScale(2, RoundingMode.HALF_UP),
                installmentResponses
        );
    }

    @Transactional(readOnly = true)
    public Page<InstallmentResponse> getPayments(Long loanId, User currentUser, Pageable pageable) {
        LoanApplication loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + loanId));

        validateScheduleAccess(loan, currentUser);

        return installmentRepository.findByScheduleLoanApplicationIdAndStatusOrderByInstallmentNumberAsc(loanId, InstallmentStatus.PAID, pageable)
                .map(InstallmentResponse::from);
    }

    @Transactional
    public int checkDelinquency() {
        LocalDate today = LocalDate.now();
        List<Installment> overdueInstallments = installmentRepository.findByStatusNotAndDueDateBefore(InstallmentStatus.PAID, today);
        int markedCount = 0;

        for (Installment inst : overdueInstallments) {
            if (inst.getStatus() != InstallmentStatus.OVERDUE) {
                inst.setStatus(InstallmentStatus.OVERDUE);
                LoanApplication loan = inst.getSchedule().getLoanApplication();
                if (!loan.isDelinquent()) {
                    loan.setDelinquent(true);
                    loanRepository.save(loan);
                }
                installmentRepository.save(inst);
                markedCount++;
            }
        }
        log.info("Delinquency check completed. Flagged {} installments as OVERDUE.", markedCount);
        return markedCount;
    }

    @Transactional(readOnly = true)
    public Page<LoanResponse> getDelinquentLoans(Pageable pageable) {
        return loanRepository.findByDelinquentTrueOrderByCreatedAtDesc(pageable)
                .map(LoanResponse::from);
    }

    private void validateScheduleAccess(LoanApplication loan, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.CREDIT_ANALYST || currentUser.getRole() == Role.AUDITOR) {
            return;
        }
        boolean isOwner = (loan.getBorrower() != null && loan.getBorrower().getId().equals(currentUser.getId()))
                || loan.getSubmittedBy().getId().equals(currentUser.getId());
        if (!isOwner) {
            throw new AccessDeniedException("You are not authorized to view this loan's repayment schedule.");
        }
    }
}
