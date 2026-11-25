package com.finguard.finguard_api.analytics;

import com.finguard.finguard_api.analytics.dto.AnalyticsAskResponse;
import com.finguard.finguard_api.analytics.dto.ChartSeries;
import com.finguard.finguard_api.analytics.dto.ChartSpec;
import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.loan.LoanApplication;
import com.finguard.finguard_api.loan.LoanRepository;
import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
@Slf4j
public class AnalyticsService {

    private final LoanRepository loanRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.model:gemini-2.5-flash}")
    private String model;

    // Rate limiting: 10 requests per 60 seconds per user
    private final Map<Long, ConcurrentLinkedDeque<Long>> rateLimitMap = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final long WINDOW_MILLIS = 60_000L;

    public AnalyticsService(LoanRepository loanRepository, AuditLogService auditLogService, ObjectMapper objectMapper) {
        this.loanRepository = loanRepository;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(4));

        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .requestFactory(factory)
                .build();
    }

    public AnalyticsAskResponse ask(String question, User user) {
        checkRateLimit(user.getId());

        boolean isPersonalUser = user.getRole() == Role.USER || user.getRole() == Role.BORROWER;
        PortfolioAggregates aggregates = isPersonalUser
                ? computeUserAggregates(user.getId())
                : computeAggregates();

        String systemPrompt = """
                You are FinGuard's senior portfolio analytics engine.
                Analyze the portfolio aggregates and answer the user's query.
                Return ONLY a JSON object with:
                - "answer": concise analysis (2-3 sentences max) answering the question directly.
                - "chart": { "type": "BAR" | "LINE" | "PIE", "title": string, "labels": [string], "series": [ { "name": string, "data": [number] } ] }
                Never output Markdown formatting or backticks. Return raw JSON only.
                """;

        String context = """
                <portfolio_data>
                Total Volume: KES %s
                Total Loans: %d
                Status Counts: %s
                Risk Band Counts: %s
                Delinquent Loans: %d
                Monthly Origination (Past Months): %s
                Approval Breakdown by Risk Band: %s
                </portfolio_data>
                <user_question>
                %s
                </user_question>
                """.formatted(
                aggregates.totalVolume(),
                aggregates.totalLoans(),
                aggregates.statusCounts(),
                aggregates.riskCounts(),
                aggregates.delinquentCount(),
                aggregates.monthlyVolume(),
                aggregates.riskStatusBreakdown(),
                question.replace("<", "").replace(">", "")
        );

        AnalyticsAskResponse response;
        try {
            Map<String, Object> requestBody = Map.of(
                    "systemInstruction", Map.of(
                            "parts", List.of(Map.of("text", systemPrompt))
                    ),
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of("text", context))
                    )),
                    "generationConfig", Map.of(
                            "responseMimeType", "application/json",
                            "temperature", 0.2,
                            "maxOutputTokens", 600,
                            "thinkingConfig", Map.of("thinkingBudget", 0)
                    )
            );

            String rawResponse = restClient.post()
                    .uri("/v1beta/models/{model}:generateContent", model)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(rawResponse);
            String jsonText = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            response = objectMapper.readValue(jsonText, AnalyticsAskResponse.class);
            if (response == null || response.chart() == null) {
                throw new IllegalStateException("Gemini returned incomplete chart payload");
            }
        } catch (Exception ex) {
            log.warn("Gemini analytics assistant query failed ({}); generating deterministic fallback.", ex.getMessage());
            response = computeFallbackResponse(question, aggregates);
        }

        auditLogService.record(
                "ANALYTICS_QUERY",
                "PORTFOLIO_ANALYTICS",
                0L,
                user,
                "Queried: " + question
        );

        return response;
    }

    private void checkRateLimit(Long userId) {
        long now = System.currentTimeMillis();
        ConcurrentLinkedDeque<Long> timestamps = rateLimitMap.computeIfAbsent(userId, k -> new ConcurrentLinkedDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MILLIS) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= MAX_REQUESTS_PER_MINUTE) {
                throw new IllegalStateException("Rate limit exceeded: Maximum 10 analytics questions per minute. Please try again in a moment.");
            }
            timestamps.addLast(now);
        }
    }

    public PortfolioAggregates computeAggregates() {
        BigDecimal totalVolume = loanRepository.sumTotalRequestedAmount();
        List<Object[]> statusRows = loanRepository.countByStatusGrouped();
        List<Object[]> riskRows = loanRepository.countByAiRiskLevelGrouped();
        List<Object[]> monthlyRows = loanRepository.findMonthlyOriginationVolume();
        List<Object[]> riskStatusRows = loanRepository.countByRiskLevelAndStatusGrouped();
        long delinquentCount = loanRepository.countByDelinquentTrue();

        Map<String, Long> statusMap = new LinkedHashMap<>();
        long totalLoans = 0;
        for (Object[] r : statusRows) {
            String status = r[0] != null ? r[0].toString() : "UNKNOWN";
            long count = ((Number) r[1]).longValue();
            statusMap.put(status, count);
            totalLoans += count;
        }

        Map<String, Long> riskMap = new LinkedHashMap<>();
        for (Object[] r : riskRows) {
            if (r[0] != null) {
                riskMap.put(r[0].toString(), ((Number) r[1]).longValue());
            }
        }

        Map<String, String> monthlyMap = new LinkedHashMap<>();
        for (Object[] r : monthlyRows) {
            String m = r[0] != null ? r[0].toString() : "Unknown";
            long count = ((Number) r[1]).longValue();
            String vol = r[2] != null ? r[2].toString() : "0";
            monthlyMap.put(m, count + " loans (KES " + vol + ")");
        }

        StringBuilder riskStatusBuilder = new StringBuilder();
        for (Object[] r : riskStatusRows) {
            if (!riskStatusBuilder.isEmpty()) riskStatusBuilder.append(", ");
            riskStatusBuilder.append(r[0]).append(" / ").append(r[1]).append(": ").append(r[2]);
        }

        return new PortfolioAggregates(
                totalVolume != null ? totalVolume : BigDecimal.ZERO,
                totalLoans,
                statusMap,
                riskMap,
                delinquentCount,
                monthlyMap,
                riskStatusBuilder.toString()
        );
    }

    public PortfolioAggregates computeUserAggregates(Long userId) {
        List<LoanApplication> userLoans = loanRepository
                .findByBorrowerIdOrSubmittedByIdOrderByCreatedAtDesc(userId, userId, Pageable.unpaged())
                .getContent();

        BigDecimal totalVolume = BigDecimal.ZERO;
        Map<String, Long> statusMap = new LinkedHashMap<>();
        Map<String, Long> riskMap = new LinkedHashMap<>();
        Map<String, Integer> monthlyCount = new LinkedHashMap<>();
        Map<String, BigDecimal> monthlyVol = new LinkedHashMap<>();
        long delinquentCount = 0;

        for (LoanApplication loan : userLoans) {
            if (loan.getRequestedAmount() != null) {
                totalVolume = totalVolume.add(loan.getRequestedAmount());
            }
            String st = loan.getStatus() != null ? loan.getStatus().name() : "UNKNOWN";
            statusMap.merge(st, 1L, Long::sum);

            if (loan.getAiRiskLevel() != null) {
                riskMap.merge(loan.getAiRiskLevel(), 1L, Long::sum);
            }
            if (loan.isDelinquent()) {
                delinquentCount++;
            }
            if (loan.getCreatedAt() != null) {
                String ym = String.format("%d-%02d", loan.getCreatedAt().getYear(), loan.getCreatedAt().getMonthValue());
                monthlyCount.merge(ym, 1, Integer::sum);
                monthlyVol.merge(ym, loan.getRequestedAmount() != null ? loan.getRequestedAmount() : BigDecimal.ZERO, BigDecimal::add);
            }
        }

        Map<String, String> monthlyMap = new LinkedHashMap<>();
        for (String ym : monthlyCount.keySet()) {
            monthlyMap.put(ym, monthlyCount.get(ym) + " loans (KES " + monthlyVol.get(ym) + ")");
        }

        return new PortfolioAggregates(
                totalVolume,
                userLoans.size(),
                statusMap,
                riskMap,
                delinquentCount,
                monthlyMap,
                ""
        );
    }

    public AnalyticsAskResponse computeFallbackResponse(String question, PortfolioAggregates agg) {
        String q = question.toLowerCase();

        if (q.contains("delinquen") || q.contains("overdue") || q.contains("late")) {
            long performing = Math.max(0, agg.totalLoans() - agg.delinquentCount());
            double rate = agg.totalLoans() > 0 ? (agg.delinquentCount() * 100.0) / agg.totalLoans() : 0.0;
            return new AnalyticsAskResponse(
                    String.format("Currently, %d of %d loans (%.1f%%) are flagged as delinquent, while %d facilities are performing.",
                            agg.delinquentCount(), agg.totalLoans(), rate, performing),
                    new ChartSpec(
                            "BAR",
                            "Portfolio Delinquency Overview",
                            List.of("Delinquent", "Performing"),
                            List.of(new ChartSeries("Loans", List.of(agg.delinquentCount(), performing)))
                    )
            );
        } else if (q.contains("approv") || q.contains("rate") || q.contains("reject")) {
            long approved = agg.statusCounts().getOrDefault("APPROVED", 0L);
            long rejected = agg.statusCounts().getOrDefault("REJECTED", 0L);
            long pending = agg.statusCounts().getOrDefault("PENDING", 0L)
                    + agg.statusCounts().getOrDefault("UNDER_REVIEW", 0L)
                    + agg.statusCounts().getOrDefault("CORRECTION_REQUIRED", 0L);
            double approvalRate = agg.totalLoans() > 0 ? (approved * 100.0) / agg.totalLoans() : 0.0;
            return new AnalyticsAskResponse(
                    String.format("Overall approval rate is %.1f%% (%d approved, %d rejected, %d active in review/pending) across %d total applications.",
                            approvalRate, approved, rejected, pending, agg.totalLoans()),
                    new ChartSpec(
                            "BAR",
                            "Underwriting Outcomes",
                            List.of("Approved", "In Review / Pending", "Rejected"),
                            List.of(new ChartSeries("Applications", List.of(approved, pending, rejected)))
                    )
            );
        } else if (q.contains("month") || q.contains("trend") || q.contains("volume") || q.contains("origination")) {
            List<String> labels = new ArrayList<>(agg.monthlyVolume().keySet());
            Collections.reverse(labels);
            List<Number> data = new ArrayList<>();
            for (String l : labels) {
                String val = agg.monthlyVolume().get(l);
                int loansIndex = val.indexOf(" loans");
                data.add(loansIndex > 0 ? Integer.parseInt(val.substring(0, loansIndex)) : 1);
            }
            return new AnalyticsAskResponse(
                    "Total origination volume stands at KES " + agg.totalVolume().toPlainString() + " across " + agg.totalLoans() + " applications.",
                    new ChartSpec(
                            "LINE",
                            "Origination Volume by Month",
                            labels.isEmpty() ? List.of("Current") : labels,
                            List.of(new ChartSeries("Applications", data.isEmpty() ? List.of(agg.totalLoans()) : data))
                    )
            );
        } else if (q.contains("risk") || q.contains("tier") || q.contains("distribution")) {
            long low = agg.riskCounts().getOrDefault("LOW", 0L);
            long med = agg.riskCounts().getOrDefault("MEDIUM", 0L);
            long high = agg.riskCounts().getOrDefault("HIGH", 0L);
            return new AnalyticsAskResponse(
                    "Credit risk distribution: " + low + " Low Risk, " + med + " Medium Risk, and " + high + " High Risk applications.",
                    new ChartSpec(
                            "PIE",
                            "Credit Risk Tier Distribution",
                            List.of("LOW", "MEDIUM", "HIGH"),
                            List.of(new ChartSeries("Loans", List.of(low, med, high)))
                    )
            );
        } else if (q.contains("support") || q.contains("contact") || q.contains("help") || q.contains("team")) {
            return new AnalyticsAskResponse(
                    "Our active FinGuard Support Team is available 24/7 via support@finguard.com or +254 700 123 456. You can also send a direct support ticket from the Support Desk panel on this page.",
                    defaultStatusChart(agg)
            );
        } else if (q.contains("interest") || q.contains("daily") || q.contains("calculat") || q.contains("emi")) {
            return new AnalyticsAskResponse(
                    "FinGuard calculates daily interest as Principal × (Annual Rate / 100) / 365, and monthly installments using a reducing-balance formula (default 12% p.a.). Open the Calculator tab anytime to simulate exact daily accrual and monthly schedules.",
                    defaultStatusChart(agg)
            );
        } else if (q.contains("apply") || q.contains("document") || q.contains("kyc") || q.contains("correct") || q.contains("edit")) {
            return new AnalyticsAskResponse(
                    "To apply, click 'Apply' in your portal and attach your National ID, Payslip, or Bank Statement (PDF/JPG/PNG up to 10MB). If an analyst requests a correction, you can edit and resubmit directly from your application detail page.",
                    defaultStatusChart(agg)
            );
        } else {
            return new AnalyticsAskResponse(
                    "The portfolio currently tracks " + agg.totalLoans() + " loan applications totaling KES " + agg.totalVolume().toPlainString() + ". You can ask about approval rates, delinquency, risk tiers, daily interest, KYC documents, or contact our support team.",
                    defaultStatusChart(agg)
            );
        }
    }

    private ChartSpec defaultStatusChart(PortfolioAggregates agg) {
        List<String> statuses = List.of("PENDING", "UNDER_REVIEW", "CORRECTION_REQUIRED", "APPROVED", "REJECTED");
        List<Number> counts = statuses.stream()
                .map(s -> (Number) agg.statusCounts().getOrDefault(s, 0L))
                .toList();
        return new ChartSpec(
                "BAR",
                "Applications by Underwriting Status",
                statuses,
                List.of(new ChartSeries("Applications", counts))
        );
    }

    public record PortfolioAggregates(
            BigDecimal totalVolume,
            long totalLoans,
            Map<String, Long> statusCounts,
            Map<String, Long> riskCounts,
            long delinquentCount,
            Map<String, String> monthlyVolume,
            String riskStatusBreakdown
    ) {}
}
