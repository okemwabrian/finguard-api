package com.finguard.finguard_api.document;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanDocumentRepository extends JpaRepository<LoanDocument, Long> {
    List<LoanDocument> findByLoanApplicationIdOrderByCreatedDateDesc(Long loanApplicationId);
}
