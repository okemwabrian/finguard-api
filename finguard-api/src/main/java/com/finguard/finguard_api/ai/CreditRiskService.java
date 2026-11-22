package com.finguard.finguard_api.ai;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.finguard.finguard_api.loan.LoanApplication;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class CreditRiskService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.model}")
    private String model;

    public CreditRiskService(ObjectMapper objectMapper) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(10));
        requestFactory.setReadTimeout(Duration.ofSeconds(15));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
        this.objectMapper = objectMapper;
    }

    public RiskAssessmentResponse assessRisk(LoanApplication loan) {
        String prompt = """
                You are a senior bank credit risk underwriter. Evaluate the following loan application
                and return ONLY a JSON object with keys: "riskScore" (integer 0-100), "riskLevel" ("LOW", "MEDIUM", or "HIGH"),
                and "recommendation" (1-2 concise sentences explaining key financial factors like DTI ratio).

                Borrower Name: %s
                Monthly Income: %s
                Existing Monthly Debt: %s
                Requested Loan Amount: %s
                Repayment Period (Months): %d
                Loan Purpose: %s
                """.formatted(
                loan.getBorrowerName(),
                loan.getMonthlyIncome(),
                loan.getExistingMonthlyDebt(),
                loan.getRequestedAmount(),
                loan.getRepaymentMonths(),
                loan.getPurpose()
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.2
                )
        );

        try {
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

            return objectMapper.readValue(jsonText, RiskAssessmentResponse.class);
        } catch (Exception ex) {
            log.warn("Gemini AI risk assessment failed ({}). Falling back to deterministic DTI model.", ex.getMessage());
            return calculateFallbackRisk(loan);
        }
    }

    private RiskAssessmentResponse calculateFallbackRisk(LoanApplication loan) {
        BigDecimal monthlyInstallment = loan.getRequestedAmount()
                .divide(BigDecimal.valueOf(loan.getRepaymentMonths()), 2, RoundingMode.HALF_UP);
        BigDecimal totalMonthlyDebt = loan.getExistingMonthlyDebt().add(monthlyInstallment);
        BigDecimal dtiRatio = totalMonthlyDebt
                .divide(loan.getMonthlyIncome(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));

        if (dtiRatio.compareTo(BigDecimal.valueOf(35)) <= 0) {
            return new RiskAssessmentResponse(25, "LOW", "Fallback DTI assessment: Healthy debt-to-income ratio (" + dtiRatio.intValue() + "%).");
        } else if (dtiRatio.compareTo(BigDecimal.valueOf(50)) <= 0) {
            return new RiskAssessmentResponse(55, "MEDIUM", "Fallback DTI assessment: Moderate debt-to-income ratio (" + dtiRatio.intValue() + "%). Manual verification advised.");
        } else {
            return new RiskAssessmentResponse(85, "HIGH", "Fallback DTI assessment: High debt-to-income ratio (" + dtiRatio.intValue() + "%). Elevated default risk.");
        }
    }
}
