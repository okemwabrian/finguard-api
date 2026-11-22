package com.finguard.finguard_api.audit;

import com.finguard.finguard_api.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void record(String action, String entityType, Long entityId, User actor, String details) {
        AuditLog log = AuditLog.builder()
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .performedByEmail(actor.getEmail())
                .performedByRole(actor.getRole().name())
                .details(details)
                .build();
        auditLogRepository.save(log);
    }

    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }

    public Page<AuditLog> getLogsForEntity(Long entityId, Pageable pageable) {
        return auditLogRepository.findByEntityIdOrderByTimestampDesc(entityId, pageable);
    }
}
