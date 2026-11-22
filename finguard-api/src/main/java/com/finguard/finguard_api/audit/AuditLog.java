package com.finguard.finguard_api.audit;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_entity_id", columnList = "entityId"),
        @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // e.g. LOAN_CREATED, LOAN_UNDER_REVIEW, LOAN_APPROVED, LOAN_REJECTED

    @Column(nullable = false)
    private String entityType; // e.g. LOAN_APPLICATION

    @Column(nullable = false)
    private Long entityId;

    @Column(nullable = false)
    private String performedByEmail;

    @Column(nullable = false)
    private String performedByRole;

    @Column(length = 1000)
    private String details;

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }
}
