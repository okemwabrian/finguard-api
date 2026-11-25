package com.finguard.finguard_api.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByEntityIdOrderByTimestampDesc(Long entityId, Pageable pageable);
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    List<AuditLog> findTop30ByPerformedByEmailOrderByTimestampDesc(String email);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:from IS NULL OR a.timestamp >= :from) AND " +
           "(:to IS NULL OR a.timestamp <= :to) AND " +
           "(:entityType IS NULL OR a.entityType = :entityType) " +
           "ORDER BY a.timestamp DESC")
    List<AuditLog> findFiltered(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("entityType") String entityType
    );
}
