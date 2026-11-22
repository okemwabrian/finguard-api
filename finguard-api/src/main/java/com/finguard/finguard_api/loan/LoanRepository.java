package com.finguard.finguard_api.loan;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanRepository extends JpaRepository<LoanApplication, Long> {
    Page<LoanApplication> findByStatusOrderByCreatedAtDesc(LoanStatus status, Pageable pageable);
    Page<LoanApplication> findBySubmittedByIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<LoanApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
