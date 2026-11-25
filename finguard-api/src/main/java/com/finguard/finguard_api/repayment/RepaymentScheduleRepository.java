package com.finguard.finguard_api.repayment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RepaymentScheduleRepository extends JpaRepository<RepaymentSchedule, Long> {
    Optional<RepaymentSchedule> findByLoanApplicationId(Long loanApplicationId);
}
