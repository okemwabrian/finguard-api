package com.finguard.finguard_api.repayment;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InstallmentRepository extends JpaRepository<Installment, Long> {
    List<Installment> findByScheduleLoanApplicationIdOrderByInstallmentNumberAsc(Long loanApplicationId);
    Page<Installment> findByScheduleLoanApplicationIdAndStatusOrderByInstallmentNumberAsc(Long loanApplicationId, InstallmentStatus status, Pageable pageable);
    Optional<Installment> findByScheduleLoanApplicationIdAndInstallmentNumber(Long loanApplicationId, Integer installmentNumber);
    List<Installment> findByStatusNotAndDueDateBefore(InstallmentStatus status, LocalDate date);
    @Query("""
            SELECT i FROM Installment i
            JOIN FETCH i.schedule s
            JOIN FETCH s.loanApplication l
            JOIN FETCH l.submittedBy
            LEFT JOIN FETCH l.borrower
            WHERE i.status IN :statuses
              AND i.dueDate <= :date
              AND (l.borrower.id IN :recipientIds OR (l.borrower IS NULL AND l.submittedBy.id IN :recipientIds))
            """)
    List<Installment> findDueForBorrowers(
            @Param("statuses") List<InstallmentStatus> statuses,
            @Param("date") LocalDate date,
            @Param("recipientIds") List<Long> recipientIds
    );

    @Modifying
    @Query("DELETE FROM Installment i WHERE i.schedule.loanApplication.id = :loanId")
    void deleteByLoanApplicationId(@Param("loanId") Long loanId);
}
