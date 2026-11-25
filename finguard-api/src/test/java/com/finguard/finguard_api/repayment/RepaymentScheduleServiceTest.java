package com.finguard.finguard_api.repayment;

import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.loan.LoanApplication;
import com.finguard.finguard_api.loan.LoanRepository;
import com.finguard.finguard_api.loan.LoanStatus;
import com.finguard.finguard_api.notification.NotificationService;
import com.finguard.finguard_api.repayment.dto.InstallmentResponse;
import com.finguard.finguard_api.repayment.dto.RecordPaymentRequest;
import com.finguard.finguard_api.repayment.dto.ScheduleSummaryResponse;
import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RepaymentScheduleServiceTest {

    @Mock
    private RepaymentScheduleRepository scheduleRepository;

    @Mock
    private InstallmentRepository installmentRepository;

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private RepaymentScheduleService repaymentScheduleService;

    private LoanApplication loan;
    private User borrower;
    private User analyst;

    @BeforeEach
    void setUp() {
        borrower = User.builder().id(10L).email("borrower@test.com").role(Role.BORROWER).build();
        analyst = User.builder().id(20L).email("analyst@finguard.com").role(Role.CREDIT_ANALYST).build();

        loan = LoanApplication.builder()
                .id(1L)
                .borrowerName("Jane Doe")
                .borrowerNationalId("12345678")
                .requestedAmount(new BigDecimal("120000.00"))
                .monthlyIncome(new BigDecimal("60000.00"))
                .existingMonthlyDebt(new BigDecimal("5000.00"))
                .repaymentMonths(12)
                .termMonths(12)
                .interestRate(new BigDecimal("12.00"))
                .purpose("Working capital")
                .status(LoanStatus.APPROVED)
                .submittedBy(borrower)
                .borrower(borrower)
                .build();
    }

    @Test
    void shouldGenerateScheduleWithCorrectAmortizationAndZeroClosingBalance() {
        when(scheduleRepository.findByLoanApplicationId(1L)).thenReturn(Optional.empty());
        when(scheduleRepository.save(any(RepaymentSchedule.class))).thenAnswer(i -> i.getArgument(0));

        RepaymentSchedule schedule = repaymentScheduleService.generateSchedule(loan);

        assertThat(schedule).isNotNull();
        assertThat(schedule.getInstallments()).hasSize(12);

        // Verify first installment is DUE, remaining are UPCOMING
        assertThat(schedule.getInstallments().get(0).getStatus()).isEqualTo(InstallmentStatus.DUE);
        for (int i = 1; i < 12; i++) {
            assertThat(schedule.getInstallments().get(i).getStatus()).isEqualTo(InstallmentStatus.UPCOMING);
        }

        // Verify continuity of balances: opening balance of month i = closing balance of month i-1
        for (int i = 1; i < 12; i++) {
            Installment prev = schedule.getInstallments().get(i - 1);
            Installment curr = schedule.getInstallments().get(i);
            assertThat(curr.getOpeningBalance()).isEqualByComparingTo(prev.getClosingBalance());
        }

        // Final installment closing balance must close to 0.00
        Installment lastInstallment = schedule.getInstallments().get(11);
        assertThat(lastInstallment.getClosingBalance()).isEqualByComparingTo(BigDecimal.ZERO);

        // Sum of all principal components must equal loan principal
        BigDecimal totalPrincipalSum = schedule.getInstallments().stream()
                .map(Installment::getPrincipalComponent)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(totalPrincipalSum).isEqualByComparingTo(loan.getRequestedAmount());
    }

    @Test
    void shouldRecordPaymentSuccessfully() {
        RepaymentSchedule schedule = RepaymentSchedule.builder()
                .id(100L)
                .loanApplication(loan)
                .build();

        Installment installment = Installment.builder()
                .id(50L)
                .schedule(schedule)
                .installmentNumber(1)
                .status(InstallmentStatus.DUE)
                .principalComponent(new BigDecimal("10000.00"))
                .interestComponent(new BigDecimal("1200.00"))
                .dueDate(LocalDate.now().plusDays(10))
                .build();

        when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));
        when(installmentRepository.findByScheduleLoanApplicationIdAndInstallmentNumber(1L, 1))
                .thenReturn(Optional.of(installment));
        when(installmentRepository.save(any(Installment.class))).thenAnswer(i -> i.getArgument(0));

        RecordPaymentRequest request = new RecordPaymentRequest(
                new BigDecimal("11200.00"),
                1,
                LocalDate.now(),
                "MPESA"
        );

        InstallmentResponse response = repaymentScheduleService.recordPayment(1L, request, analyst);

        assertThat(response.status()).isEqualTo(InstallmentStatus.PAID);
        assertThat(response.paymentMethod()).isEqualTo("MPESA");
        assertThat(response.paidAmount()).isEqualByComparingTo(new BigDecimal("11200.00"));

        verify(auditLogService, times(1)).record(eq("PAYMENT_RECORDED"), any(), any(), eq(analyst), any());
        verify(notificationService, times(1)).sendNotification(eq(borrower), any(), any(), any(), eq(1L));
    }

    @Test
    void shouldRejectPaymentIfAlreadyPaid() {
        Installment paidInstallment = Installment.builder()
                .id(50L)
                .installmentNumber(1)
                .status(InstallmentStatus.PAID)
                .build();

        when(loanRepository.findById(1L)).thenReturn(Optional.of(loan));
        when(installmentRepository.findByScheduleLoanApplicationIdAndInstallmentNumber(1L, 1))
                .thenReturn(Optional.of(paidInstallment));

        RecordPaymentRequest request = new RecordPaymentRequest(
                new BigDecimal("11200.00"),
                1,
                LocalDate.now(),
                "MPESA"
        );

        assertThrows(IllegalStateException.class, () ->
                repaymentScheduleService.recordPayment(1L, request, analyst)
        );
    }

    @Test
    void shouldMarkPastDueInstallmentsAsOverdueAndFlagLoan() {
        RepaymentSchedule schedule = RepaymentSchedule.builder()
                .id(100L)
                .loanApplication(loan)
                .build();

        Installment pastDue = Installment.builder()
                .id(1L)
                .schedule(schedule)
                .dueDate(LocalDate.now().minusDays(5))
                .status(InstallmentStatus.DUE)
                .build();

        when(installmentRepository.findByStatusNotAndDueDateBefore(eq(InstallmentStatus.PAID), any(LocalDate.class)))
                .thenReturn(List.of(pastDue));

        int flagged = repaymentScheduleService.checkDelinquency();

        assertThat(flagged).isEqualTo(1);
        assertThat(pastDue.getStatus()).isEqualTo(InstallmentStatus.OVERDUE);
        assertThat(loan.isDelinquent()).isTrue();
        verify(loanRepository, times(1)).save(loan);
        verify(installmentRepository, times(1)).save(pastDue);
    }
}
