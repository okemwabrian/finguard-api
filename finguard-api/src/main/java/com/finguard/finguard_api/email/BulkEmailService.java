package com.finguard.finguard_api.email;

import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.loan.LoanApplication;
import com.finguard.finguard_api.repayment.Installment;
import com.finguard.finguard_api.repayment.InstallmentRepository;
import com.finguard.finguard_api.repayment.InstallmentStatus;
import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import com.finguard.finguard_api.user.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Slf4j
public class BulkEmailService {

    private final UserRepository userRepository;
    private final InstallmentRepository installmentRepository;
    private final AuditLogService auditLogService;
    private final JavaMailSender mailSender;
    private final String mailHost;

    public BulkEmailService(
            UserRepository userRepository,
            InstallmentRepository installmentRepository,
            AuditLogService auditLogService,
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${spring.mail.host:}") String mailHost
    ) {
        this.userRepository = userRepository;
        this.installmentRepository = installmentRepository;
        this.auditLogService = auditLogService;
        this.mailSender = mailSender;
        this.mailHost = mailHost;
    }

    @Transactional
    public BulkEmailResponse send(BulkEmailRequest request, User admin) {
        if (mailSender == null || mailHost.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Email delivery is not configured.");
        }

        List<Long> recipientIds = request.recipientIds().stream().distinct().toList();
        if (recipientIds.size() > 200) {
            throw new IllegalArgumentException("A single campaign may include at most 200 borrowers.");
        }

        List<User> recipients = userRepository.findAllById(recipientIds);
        Map<Long, User> recipientById = new LinkedHashMap<>();
        recipients.stream()
                .filter(User::isActive)
                .filter(user -> user.getRole() == Role.USER || user.getRole() == Role.BORROWER)
                .forEach(user -> recipientById.put(user.getId(), user));

        if (recipientById.size() != recipientIds.size()) {
            throw new IllegalArgumentException("One or more selected accounts are unavailable or are not active borrowers.");
        }

        Map<Long, DueSummary> dueByUserId = request.paymentReminder()
                ? collectDueAmounts(recipientById)
                : Map.of();

        int sent = 0;
        int failed = 0;
        int skipped = 0;
        for (User recipient : recipientById.values()) {
            DueSummary due = dueByUserId.get(recipient.getId());
            if (request.paymentReminder() && due == null) {
                skipped++;
                continue;
            }

            String subject = personalize(request.subject(), recipient, due);
            String body = personalize(request.body(), recipient, due);
            if (request.paymentReminder() && !request.body().contains("{amount}")) {
                body += "\n\nAmount due: KES " + due.formattedAmount();
            }
            if (request.paymentReminder() && !request.body().contains("{dueDate}")) {
                body += "\nDue date: " + due.dueDate();
            }

            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(recipient.getEmail());
                message.setSubject(subject);
                message.setText(body + "\n\nFinGuard");
                mailSender.send(message);
                sent++;
            } catch (MailException exception) {
                failed++;
                log.warn("Bulk email delivery failed for borrower id {} ({})",
                        recipient.getId(), exception.getClass().getSimpleName());
            }
        }

        String message = failed > 0
                ? "Email delivery completed with " + failed + " failure(s)."
                : skipped > 0
                ? "Sent " + sent + " email(s); " + skipped + " borrower(s) had no due installments."
                : "Sent " + sent + " email(s).";
        auditLogService.record(
                "BULK_EMAIL_ATTEMPTED",
                "EMAIL_CAMPAIGN",
                admin.getId(),
                admin,
                "Initiated by admin id " + admin.getId()
                        + ". Payment reminder: " + request.paymentReminder()
                        + ", sent: " + sent + ", failed: " + failed + ", skipped: " + skipped
        );
        return new BulkEmailResponse(sent, failed, skipped, message);
    }

    private Map<Long, DueSummary> collectDueAmounts(Map<Long, User> recipients) {
        List<Installment> dueInstallments = installmentRepository.findDueForBorrowers(
                List.of(InstallmentStatus.DUE, InstallmentStatus.OVERDUE),
                LocalDate.now(),
                List.copyOf(recipients.keySet())
        );
        Map<Long, BigDecimal> amounts = new HashMap<>();
        Map<Long, LocalDate> dates = new HashMap<>();

        for (Installment installment : dueInstallments) {
            LoanApplication loan = installment.getSchedule().getLoanApplication();
            User borrower = loan.getBorrower() != null ? loan.getBorrower() : loan.getSubmittedBy();
            if (!recipients.containsKey(borrower.getId())) {
                continue;
            }
            BigDecimal amount = installment.getPrincipalComponent().add(installment.getInterestComponent());
            amounts.merge(borrower.getId(), amount, BigDecimal::add);
            dates.merge(borrower.getId(), installment.getDueDate(),
                    (existing, next) -> existing.isBefore(next) ? existing : next);
        }

        Map<Long, DueSummary> summaries = new HashMap<>();
        amounts.forEach((userId, amount) -> summaries.put(userId, new DueSummary(
                NumberFormat.getNumberInstance(Locale.US).format(amount),
                dates.get(userId)
        )));
        return summaries;
    }

    private String personalize(String template, User recipient, DueSummary due) {
        String personalized = template.replace("{name}", recipient.getFullName());
        if (due != null) {
            personalized = personalized
                    .replace("{amount}", due.formattedAmount())
                    .replace("{dueDate}", due.dueDate().toString());
        }
        return personalized;
    }

    private record DueSummary(String formattedAmount, LocalDate dueDate) {
    }
}
