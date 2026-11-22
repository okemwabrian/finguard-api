package com.finguard.finguard_api.audit;

import com.finguard.finguard_api.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    public List<AuditLog> getLogsForEntity(Long entityId) {
        return auditLogRepository.findByEntityIdOrderByTimestampDesc(entityId);
    }
}
