package com.finguard.finguard_api.loan;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanRepository extends JpaRepository<LoanApplication, Long> {
    List<LoanApplication> findByStatusOrderByCreatedAtDesc(LoanStatus status);
    List<LoanApplication> findBySubmittedByIdOrderByCreatedAtDesc(Long userId);
    List<LoanApplication> findAllByOrderByCreatedAtDesc();
}
