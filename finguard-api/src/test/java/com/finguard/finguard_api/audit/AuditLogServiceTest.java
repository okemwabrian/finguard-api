package com.finguard.finguard_api.audit;

import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    private User auditor;

    @BeforeEach
    void setUp() {
        auditor = User.builder()
                .id(5L)
                .email("auditor@finguard.com")
                .role(Role.AUDITOR)
                .build();
    }

    @Test
    void shouldRecordAuditLogSuccessfully() {
        auditLogService.record("LOAN_CREATED", "LOAN_APPLICATION", 10L, auditor, "Loan 10 created");

        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void shouldReturnPagedAuditLogs() {
        AuditLog log1 = AuditLog.builder().id(1L).action("LOAN_CREATED").entityId(10L).build();
        AuditLog log2 = AuditLog.builder().id(2L).action("LOAN_UNDER_REVIEW").entityId(10L).build();
        Page<AuditLog> page = new PageImpl<>(List.of(log1, log2));
        Pageable pageable = PageRequest.of(0, 10);

        when(auditLogRepository.findAllByOrderByTimestampDesc(pageable)).thenReturn(page);

        Page<AuditLog> result = auditLogService.getAllLogs(pageable);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        verify(auditLogRepository, times(1)).findAllByOrderByTimestampDesc(pageable);
    }
}
