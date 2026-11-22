package com.finguard.finguard_api.audit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEntityIdOrderByTimestampDesc(Long entityId);
    List<AuditLog> findAllByOrderByTimestampDesc();
}
