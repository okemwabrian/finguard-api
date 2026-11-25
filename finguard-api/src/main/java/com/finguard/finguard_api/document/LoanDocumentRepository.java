package com.finguard.finguard_api.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LoanDocumentRepository extends JpaRepository<LoanDocument, Long> {
    List<LoanDocument> findByLoanApplicationIdOrderByCreatedDateDesc(Long loanApplicationId);

    long countByUploadedById(Long uploadedById);

    @Modifying
    @Query("UPDATE LoanDocument d SET d.verifiedBy = null WHERE d.verifiedBy.id = :userId")
    void clearVerifiedByUserId(@Param("userId") Long userId);
}
