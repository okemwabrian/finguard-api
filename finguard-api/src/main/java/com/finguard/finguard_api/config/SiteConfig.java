package com.finguard.finguard_api.config;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "site_config")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteConfig {

    @Id
    private Long id; // Singleton row id = 1L

    @Column(nullable = false)
    @Builder.Default
    private String heroModel = "VAULT_3D"; // VAULT_3D | ANALYTICS_ORBIT | CARD_STACK_3D

    @Column(nullable = false)
    @Builder.Default
    private String heroBadge = "Intelligent Credit & Digital Lending";

    @Column(nullable = false)
    @Builder.Default
    private String heroTitle = "Modern Lending, Built on Trust";

    @Column(nullable = false, length = 500)
    @Builder.Default
    private String heroSubtitle = "Apply for personal or business financing in minutes. FinGuard pairs real-time credit risk scoring with transparent disbursement tracking, daily interest clarity, and instant digital receipts.";

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = LocalDateTime.now();
    }
}
