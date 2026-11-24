package com.finguard.finguard_api.loan;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface LoanRepository extends JpaRepository<LoanApplication, Long> {
    Page<LoanApplication> findByStatusOrderByCreatedAtDesc(LoanStatus status, Pageable pageable);
    Page<LoanApplication> findBySubmittedByIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<LoanApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT COALESCE(SUM(l.requestedAmount), 0) FROM LoanApplication l")
    BigDecimal sumTotalRequestedAmount();

    @Query("SELECT COALESCE(SUM(l.requestedAmount), 0) FROM LoanApplication l WHERE l.submittedBy.id = :userId")
    BigDecimal sumTotalRequestedAmountByUserId(@Param("userId") Long userId);

    @Query("SELECT l.status, COUNT(l) FROM LoanApplication l GROUP BY l.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT l.status, COUNT(l) FROM LoanApplication l WHERE l.submittedBy.id = :userId GROUP BY l.status")
    List<Object[]> countByStatusGroupedByUserId(@Param("userId") Long userId);

    @Query("SELECT l.aiRiskLevel, COUNT(l) FROM LoanApplication l GROUP BY l.aiRiskLevel")
    List<Object[]> countByAiRiskLevelGrouped();

    @Query("SELECT l.aiRiskLevel, COUNT(l) FROM LoanApplication l WHERE l.submittedBy.id = :userId GROUP BY l.aiRiskLevel")
    List<Object[]> countByAiRiskLevelGroupedByUserId(@Param("userId") Long userId);
}
