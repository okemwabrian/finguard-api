package com.finguard.finguard_api.loan;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface LoanRepository extends JpaRepository<LoanApplication, Long> {
    Page<LoanApplication> findByStatusOrderByCreatedAtDesc(LoanStatus status, Pageable pageable);
    Page<LoanApplication> findBySubmittedByIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<LoanApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<LoanApplication> findByBorrowerIdOrSubmittedByIdOrderByCreatedAtDesc(Long borrowerId, Long submittedById, Pageable pageable);
    Page<LoanApplication> findByDelinquentTrueOrderByCreatedAtDesc(Pageable pageable);
    long countByDelinquentTrue();

    @Query("SELECT COALESCE(SUM(l.requestedAmount), 0) FROM LoanApplication l")
    BigDecimal sumTotalRequestedAmount();

    @Query("SELECT COALESCE(SUM(l.requestedAmount), 0) FROM LoanApplication l WHERE l.submittedBy.id = :userId OR (l.borrower IS NOT NULL AND l.borrower.id = :userId)")
    BigDecimal sumTotalRequestedAmountByUserId(@Param("userId") Long userId);

    @Query("SELECT l.status, COUNT(l) FROM LoanApplication l GROUP BY l.status")
    List<Object[]> countByStatusGrouped();

    @Query("SELECT l.status, COUNT(l) FROM LoanApplication l WHERE l.submittedBy.id = :userId OR (l.borrower IS NOT NULL AND l.borrower.id = :userId) GROUP BY l.status")
    List<Object[]> countByStatusGroupedByUserId(@Param("userId") Long userId);

    @Query("SELECT l.aiRiskLevel, COUNT(l) FROM LoanApplication l GROUP BY l.aiRiskLevel")
    List<Object[]> countByAiRiskLevelGrouped();

    @Query("SELECT l.aiRiskLevel, COUNT(l) FROM LoanApplication l WHERE l.submittedBy.id = :userId OR (l.borrower IS NOT NULL AND l.borrower.id = :userId) GROUP BY l.aiRiskLevel")
    List<Object[]> countByAiRiskLevelGroupedByUserId(@Param("userId") Long userId);

    @Query("SELECT FUNCTION('TO_CHAR', l.createdAt, 'YYYY-MM') as month, COUNT(l), COALESCE(SUM(l.requestedAmount), 0) FROM LoanApplication l GROUP BY FUNCTION('TO_CHAR', l.createdAt, 'YYYY-MM') ORDER BY month DESC")
    List<Object[]> findMonthlyOriginationVolume();

    @Query("SELECT l.aiRiskLevel, l.status, COUNT(l) FROM LoanApplication l WHERE l.aiRiskLevel IS NOT NULL GROUP BY l.aiRiskLevel, l.status")
    List<Object[]> countByRiskLevelAndStatusGrouped();

    long countBySubmittedById(Long submittedById);

    @Modifying
    @Query("UPDATE LoanApplication l SET l.reviewedBy = null WHERE l.reviewedBy.id = :userId")
    void clearReviewedByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE LoanApplication l SET l.borrower = null WHERE l.borrower.id = :userId")
    void clearBorrowerByUserId(@Param("userId") Long userId);
}
