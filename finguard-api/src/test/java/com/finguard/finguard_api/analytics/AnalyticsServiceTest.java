package com.finguard.finguard_api.analytics;

import com.finguard.finguard_api.analytics.dto.AnalyticsAskResponse;
import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.loan.LoanRepository;
import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private LoanRepository loanRepository;

    @Mock
    private AuditLogService auditLogService;

    private ObjectMapper objectMapper;
    private AnalyticsService analyticsService;
    private User testStaff;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        analyticsService = new AnalyticsService(loanRepository, auditLogService, objectMapper);

        testStaff = User.builder()
                .id(20L)
                .email("analyst@finguard.com")
                .fullName("Carol Analyst")
                .role(Role.CREDIT_ANALYST)
                .build();
    }

    @Test
    @DisplayName("computeFallbackResponse correctly categorizes delinquency questions")
    void computeFallback_delinquency() {
        AnalyticsService.PortfolioAggregates agg = new AnalyticsService.PortfolioAggregates(
                BigDecimal.valueOf(1_000_000),
                10,
                Map.of("APPROVED", 8L, "PENDING", 2L),
                Map.of("LOW", 6L, "MEDIUM", 4L),
                2L,
                Map.of("2026-11", "5 loans (KES 500000)"),
                "[]"
        );

        AnalyticsAskResponse response = analyticsService.computeFallbackResponse("What is the delinquency rate?", agg);

        assertThat(response).isNotNull();
        assertThat(response.answer()).contains("2 of 10 loans");
        assertThat(response.chart().type()).isEqualTo("BAR");
        assertThat(response.chart().title()).contains("Delinquency");
    }

    @Test
    @DisplayName("computeFallbackResponse correctly categorizes risk distribution questions")
    void computeFallback_risk() {
        AnalyticsService.PortfolioAggregates agg = new AnalyticsService.PortfolioAggregates(
                BigDecimal.valueOf(1_000_000),
                10,
                Map.of("APPROVED", 8L),
                Map.of("LOW", 5L, "MEDIUM", 3L, "HIGH", 2L),
                0L,
                Map.of(),
                "[]"
        );

        AnalyticsAskResponse response = analyticsService.computeFallbackResponse("Show me credit risk distribution", agg);

        assertThat(response).isNotNull();
        assertThat(response.chart().type()).isEqualTo("PIE");
        assertThat(response.chart().title()).contains("Credit Risk");
        assertThat(response.chart().labels()).containsExactly("LOW", "MEDIUM", "HIGH");
    }

    @Test
    @DisplayName("computeFallbackResponse correctly categorizes monthly trend questions")
    void computeFallback_trend() {
        AnalyticsService.PortfolioAggregates agg = new AnalyticsService.PortfolioAggregates(
                BigDecimal.valueOf(1_000_000),
                10,
                Map.of(),
                Map.of(),
                0L,
                Map.of("2026-11", "5 loans (KES 500000)"),
                "[]"
        );

        AnalyticsAskResponse response = analyticsService.computeFallbackResponse("What is the origination volume trend?", agg);

        assertThat(response).isNotNull();
        assertThat(response.chart().type()).isEqualTo("LINE");
        assertThat(response.chart().title()).contains("Volume");
    }

    @Test
    @DisplayName("Rate limiter throws IllegalStateException after 10 requests in 1 minute")
    void checkRateLimit_exceeded() {
        AnalyticsService.PortfolioAggregates agg = new AnalyticsService.PortfolioAggregates(
                BigDecimal.valueOf(10000),
                1,
                Map.of(),
                Map.of(),
                0L,
                Map.of(),
                "[]"
        );

        when(loanRepository.sumTotalRequestedAmount()).thenReturn(BigDecimal.valueOf(10000));
        when(loanRepository.countByDelinquentTrue()).thenReturn(0L);

        // Make 10 requests
        for (int i = 0; i < 10; i++) {
            analyticsService.ask("General overview", testStaff);
        }

        // 11th request must fail with rate limit exception
        assertThatThrownBy(() -> analyticsService.ask("11th query", testStaff))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Rate limit exceeded");
    }
}
