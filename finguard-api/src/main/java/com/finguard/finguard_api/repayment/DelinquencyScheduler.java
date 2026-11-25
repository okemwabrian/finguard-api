package com.finguard.finguard_api.repayment;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DelinquencyScheduler {

    private final RepaymentScheduleService repaymentScheduleService;

    @Scheduled(cron = "${delinquency.check.cron:0 0 1 * * ?}")
    public void runDelinquencyCheck() {
        log.info("Starting automated nightly delinquency scan...");
        try {
            int flagged = repaymentScheduleService.checkDelinquency();
            log.info("Nightly delinquency scan complete. {} installments flagged OVERDUE.", flagged);
        } catch (Exception ex) {
            log.error("Error during automated delinquency check: ", ex);
        }
    }
}
