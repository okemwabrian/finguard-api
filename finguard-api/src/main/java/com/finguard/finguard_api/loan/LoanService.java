package com.finguard.finguard_api.loan;

import com.finguard.finguard_api.ai.CreditRiskService;
import com.finguard.finguard_api.ai.RiskAssessmentResponse;
import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.config.CacheConfig;
import com.finguard.finguard_api.loan.dto.CreateLoanRequest;
import com.finguard.finguard_api.loan.dto.LoanResponse;
import com.finguard.finguard_api.loan.dto.LoanStatsResponse;
import com.finguard.finguard_api.loan.dto.ReviewLoanRequest;
import com.finguard.finguard_api.notification.NotificationService;
import com.finguard.finguard_api.notification.NotificationType;
import com.finguard.finguard_api.repayment.RepaymentScheduleService;
import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final AuditLogService auditLogService;
    private final CreditRiskService creditRiskService;
    private final RepaymentScheduleService repaymentScheduleService;
    private final NotificationService notificationService;

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.CACHE_LOANS, allEntries = true),
            @CacheEvict(value = CacheConfig.CACHE_MY_LOANS, allEntries = true),
            @CacheEvict(value = CacheConfig.CACHE_LOAN_STATS, allEntries = true)
    })
    public LoanResponse submitLoan(CreateLoanRequest request, User loanOfficer) {
        Integer term = request.termMonths() != null ? request.termMonths() : request.repaymentMonths();
        BigDecimal rate = request.interestRate() != null ? request.interestRate() : new BigDecimal("12.00");

        LoanApplication loan = LoanApplication.builder()
                .borrowerName(request.borrowerName())
                .borrowerNationalId(request.borrowerNationalId())
                .monthlyIncome(request.monthlyIncome())
                .existingMonthlyDebt(request.existingMonthlyDebt())
                .requestedAmount(request.requestedAmount())
                .repaymentMonths(term)
                .termMonths(term)
                .interestRate(rate)
                .purpose(request.purpose())
                .status(LoanStatus.PENDING)
                .submittedBy(loanOfficer)
                .build();

        if (loanOfficer.getRole() == Role.BORROWER || loanOfficer.getRole() == Role.USER) {
            loan.setBorrower(loanOfficer);
        }

        RiskAssessmentResponse risk = creditRiskService.assessRisk(loan);
        loan.setAiRiskScore(risk.riskScore());
        loan.setAiRiskLevel(risk.riskLevel());
        loan.setAiRecommendation(risk.recommendation());

        LoanApplication saved = loanRepository.save(loan);

        auditLogService.record(
                "LOAN_CREATED",
                "LOAN_APPLICATION",
                saved.getId(),
                loanOfficer,
                "Submitted loan for " + saved.getBorrowerName()
                        + " (Amount: " + saved.getRequestedAmount()
                        + ", AI Risk: " + saved.getAiRiskLevel() + " [" + saved.getAiRiskScore() + "])"
        );

        User borrowerRecipient = saved.getBorrower() != null ? saved.getBorrower() : loanOfficer;
        notificationService.sendNotification(
                borrowerRecipient,
                NotificationType.LOAN_CREATED,
                "Loan Application Submitted",
                "Your loan application #" + saved.getId() + " for KES " + saved.getRequestedAmount() + " has been received and scored.",
                saved.getId()
        );

        return LoanResponse.from(saved);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheConfig.CACHE_LOANS, allEntries = true),
            @CacheEvict(value = CacheConfig.CACHE_MY_LOANS, allEntries = true),
            @CacheEvict(value = CacheConfig.CACHE_LOAN_DETAILS, allEntries = true),
            @CacheEvict(value = CacheConfig.CACHE_LOAN_STATS, allEntries = true)
    })
    public LoanResponse updateLoanStatus(Long loanId, ReviewLoanRequest request, User analyst) {
        LoanApplication loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + loanId));

        if (loan.getSubmittedBy().getId().equals(analyst.getId())) {
            throw new IllegalStateException("Separation of duties violation: You cannot review your own loan submission.");
        }

        if (!loan.getStatus().canTransitionTo(request.newStatus())) {
            throw new IllegalStateException(
                    "Invalid status transition from " + loan.getStatus() + " to " + request.newStatus()
            );
        }

        LoanStatus previousStatus = loan.getStatus();
        loan.setStatus(request.newStatus());
        loan.setReviewerNotes(request.reviewerNotes());
        loan.setReviewedBy(analyst);

        LoanApplication updated = loanRepository.save(loan);

        if (request.newStatus() == LoanStatus.APPROVED) {
            repaymentScheduleService.generateSchedule(updated);
        }

        auditLogService.record(
                "LOAN_" + updated.getStatus().name(),
                "LOAN_APPLICATION",
                updated.getId(),
                analyst,
                "Status changed from " + previousStatus + " to " + updated.getStatus() + ". Notes: " + request.reviewerNotes()
        );

        User borrowerRecipient = updated.getBorrower() != null ? updated.getBorrower() : updated.getSubmittedBy();
        notificationService.sendNotification(
                borrowerRecipient,
                NotificationType.LOAN_STATUS_CHANGED,
                "Loan Application " + updated.getStatus(),
                "Your loan application #" + updated.getId() + " status is now " + updated.getStatus() + (request.reviewerNotes() != null ? ". Notes: " + request.reviewerNotes() : ""),
                updated.getId()
        );

        if (updated.getSubmittedBy().getRole() == Role.LOAN_OFFICER && !updated.getSubmittedBy().getId().equals(analyst.getId())) {
            notificationService.sendNotification(
                    updated.getSubmittedBy(),
                    NotificationType.LOAN_STATUS_CHANGED,
                    "Loan Submission " + updated.getStatus(),
                    "Loan application #" + updated.getId() + " (" + updated.getBorrowerName() + ") was " + updated.getStatus().name().toLowerCase() + " by " + analyst.getEmail(),
                    updated.getId()
            );
        }

        return LoanResponse.from(updated);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.CACHE_LOANS, key = "(#status != null ? #status.name() : 'ALL') + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    public Page<LoanResponse> getAllLoans(LoanStatus status, Pageable pageable) {
        Page<LoanApplication> loans = (status != null)
                ? loanRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : loanRepository.findAllByOrderByCreatedAtDesc(pageable);
        return loans.map(LoanResponse::from);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.CACHE_MY_LOANS, key = "#loanOfficer.id + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    public Page<LoanResponse> getMySubmittedLoans(User loanOfficer, Pageable pageable) {
        return loanRepository.findBySubmittedByIdOrderByCreatedAtDesc(loanOfficer.getId(), pageable)
                .map(LoanResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<LoanResponse> getBorrowerLoans(User borrower, Pageable pageable) {
        return loanRepository.findByBorrowerIdOrSubmittedByIdOrderByCreatedAtDesc(borrower.getId(), borrower.getId(), pageable)
                .map(LoanResponse::from);
    }

    @Transactional(readOnly = true)
    public LoanResponse getBorrowerLoanById(Long loanId, User borrower) {
        LoanApplication loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + loanId));

        boolean isSubmitter = loan.getSubmittedBy().getId().equals(borrower.getId());
        boolean isBorrower = loan.getBorrower() != null && loan.getBorrower().getId().equals(borrower.getId());
        if (!isSubmitter && !isBorrower) {
            throw new AccessDeniedException("You are not authorized to view this loan application.");
        }
        return LoanResponse.from(loan);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.CACHE_LOAN_DETAILS, key = "#loanId + '_' + #currentUser.id")
    public LoanResponse getLoanById(Long loanId, User currentUser) {
        LoanApplication loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan application not found: " + loanId));

        // IDOR protection: Loan Officers and Borrowers can only view loans they submitted or where they are the borrower
        if (currentUser.getRole() == Role.LOAN_OFFICER || currentUser.getRole() == Role.USER || currentUser.getRole() == Role.BORROWER) {
            boolean isSubmitter = loan.getSubmittedBy().getId().equals(currentUser.getId());
            boolean isBorrower = loan.getBorrower() != null && loan.getBorrower().getId().equals(currentUser.getId());
            if (!isSubmitter && !isBorrower) {
                throw new AccessDeniedException("You are not authorized to view this loan application.");
            }
        }

        return LoanResponse.from(loan);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.CACHE_LOAN_STATS, key = "(#currentUser.role.name() == 'USER' || #currentUser.role.name() == 'BORROWER') ? 'user_' + #currentUser.id : 'global'")
    public LoanStatsResponse getLoanStats(User currentUser) {
        boolean isBorrower = currentUser.getRole() == Role.USER || currentUser.getRole() == Role.BORROWER;
        Long userId = currentUser.getId();

        BigDecimal totalVolume = isBorrower
                ? loanRepository.sumTotalRequestedAmountByUserId(userId)
                : loanRepository.sumTotalRequestedAmount();

        List<Object[]> statusCounts = isBorrower
                ? loanRepository.countByStatusGroupedByUserId(userId)
                : loanRepository.countByStatusGrouped();

        List<Object[]> riskCounts = isBorrower
                ? loanRepository.countByAiRiskLevelGroupedByUserId(userId)
                : loanRepository.countByAiRiskLevelGrouped();

        long pending = 0;
        long underReview = 0;
        long approved = 0;
        long rejected = 0;

        for (Object[] row : statusCounts) {
            LoanStatus status = (LoanStatus) row[0];
            long count = ((Number) row[1]).longValue();
            if (status == LoanStatus.PENDING) pending = count;
            else if (status == LoanStatus.UNDER_REVIEW) underReview = count;
            else if (status == LoanStatus.APPROVED) approved = count;
            else if (status == LoanStatus.REJECTED) rejected = count;
        }

        long totalLoans = pending + underReview + approved + rejected;

        long lowRisk = 0;
        long mediumRisk = 0;
        long highRisk = 0;

        for (Object[] row : riskCounts) {
            if (row[0] != null) {
                String risk = row[0].toString().toUpperCase();
                long count = ((Number) row[1]).longValue();
                if ("LOW".equals(risk)) lowRisk = count;
                else if ("MEDIUM".equals(risk)) mediumRisk = count;
                else if ("HIGH".equals(risk)) highRisk = count;
            }
        }

        double approvalRate = totalLoans > 0
                ? Math.round((approved * 100.0 / totalLoans) * 10.0) / 10.0
                : 0.0;

        long totalScored = lowRisk + mediumRisk + highRisk;
        double lowPct = totalScored > 0 ? Math.round((lowRisk * 100.0 / totalScored) * 10.0) / 10.0 : 0.0;
        double medPct = totalScored > 0 ? Math.round((mediumRisk * 100.0 / totalScored) * 10.0) / 10.0 : 0.0;
        double highPct = totalScored > 0 ? Math.round((highRisk * 100.0 / totalScored) * 10.0) / 10.0 : 0.0;

        return new LoanStatsResponse(
                totalVolume != null ? totalVolume : BigDecimal.ZERO,
                totalLoans,
                pending,
                underReview,
                approved,
                rejected,
                approvalRate,
                lowRisk,
                mediumRisk,
                highRisk,
                lowPct,
                medPct,
                highPct
        );
    }
}
