package com.finguard.finguard_api.loan;

import com.finguard.finguard_api.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loan_applications", indexes = {
        @Index(name = "idx_loan_status", columnList = "status"),
        @Index(name = "idx_loan_submitted_by", columnList = "submitted_by_id"),
        @Index(name = "idx_loan_created_at", columnList = "createdAt")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String borrowerName;

    @Column(nullable = false)
    private String borrowerNationalId;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal monthlyIncome;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal existingMonthlyDebt;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal requestedAmount;

    @Column(nullable = false)
    private Integer repaymentMonths;

    @Column
    private Integer termMonths;

    @Builder.Default
    @Column(precision = 5, scale = 2)
    private BigDecimal interestRate = new BigDecimal("12.00");

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean delinquent = false;

    @Column(nullable = false, length = 500)
    private String purpose;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanStatus status = LoanStatus.PENDING;

    // Populated in Phase 4 (Spring AI)
    private Integer aiRiskScore;
    private String aiRiskLevel;

    @Column(length = 1000)
    private String aiRecommendation;

    @Column(length = 1000)
    private String reviewerNotes;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submitted_by_id")
    private User submittedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "borrower_id")
    private User borrower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.termMonths == null && this.repaymentMonths != null) {
            this.termMonths = this.repaymentMonths;
        } else if (this.repaymentMonths == null && this.termMonths != null) {
            this.repaymentMonths = this.termMonths;
        }
        if (this.interestRate == null) {
            this.interestRate = new BigDecimal("12.00");
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        if (this.termMonths == null && this.repaymentMonths != null) {
            this.termMonths = this.repaymentMonths;
        } else if (this.repaymentMonths == null && this.termMonths != null) {
            this.repaymentMonths = this.termMonths;
        }
        this.updatedAt = LocalDateTime.now();
    }
}
