package com.finguard.finguard_api.repayment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RepaymentScheduleRepository extends JpaRepository<RepaymentSchedule, Long> {
    Optional<RepaymentSchedule> findByLoanApplicationId(Long loanApplicationId);

    @Modifying
    @Query("DELETE FROM RepaymentSchedule r WHERE r.loanApplication.id = :loanId")
    void deleteByLoanApplicationId(@Param("loanId") Long loanId);
}
