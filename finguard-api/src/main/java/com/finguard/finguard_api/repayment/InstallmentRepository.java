package com.finguard.finguard_api.repayment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InstallmentRepository extends JpaRepository<Installment, Long> {
    List<Installment> findByScheduleLoanApplicationIdOrderByInstallmentNumberAsc(Long loanApplicationId);
    Page<Installment> findByScheduleLoanApplicationIdAndStatusOrderByInstallmentNumberAsc(Long loanApplicationId, InstallmentStatus status, Pageable pageable);
    Optional<Installment> findByScheduleLoanApplicationIdAndInstallmentNumber(Long loanApplicationId, Integer installmentNumber);
    List<Installment> findByStatusNotAndDueDateBefore(InstallmentStatus status, LocalDate date);
}
