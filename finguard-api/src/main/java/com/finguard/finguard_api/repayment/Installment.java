package com.finguard.finguard_api.repayment;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "installments", indexes = {
        @Index(name = "idx_installment_schedule", columnList = "schedule_id"),
        @Index(name = "idx_installment_status", columnList = "status"),
        @Index(name = "idx_installment_due_date", columnList = "dueDate")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Installment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "schedule_id", nullable = false)
    private RepaymentSchedule schedule;

    @Column(nullable = false)
    private Integer installmentNumber;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal openingBalance;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal principalComponent;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal interestComponent;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal closingBalance;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InstallmentStatus status = InstallmentStatus.UPCOMING;

    private LocalDateTime paidAt;

    @Column(length = 50)
    private String paymentMethod;

    @Column(precision = 15, scale = 2)
    private BigDecimal paidAmount;
}
