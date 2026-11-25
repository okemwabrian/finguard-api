package com.finguard.finguard_api.notification;

import com.finguard.finguard_api.user.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;

    public NotificationService(
            NotificationRepository notificationRepository,
            @Autowired(required = false) JavaMailSender mailSender
    ) {
        this.notificationRepository = notificationRepository;
        this.mailSender = mailSender;
    }

    @Transactional
    public Notification sendNotification(User recipient, NotificationType type, String title, String message, Long refEntityId) {
        if (recipient == null) {
            return null;
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .refEntityId(refEntityId)
                .read(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Send email asynchronously on a virtual thread
        Thread.ofVirtual().start(() -> sendEmailSafely(recipient.getEmail(), title, message));

        return saved;
    }

    private void sendEmailSafely(String recipientEmail, String subject, String body) {
        if (mailSender == null) {
            log.debug("JavaMailSender not configured; simulated email sent to {}: {}", recipientEmail, subject);
            return;
        }
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setTo(recipientEmail);
            mailMessage.setSubject("FinGuard AI: " + subject);
            mailMessage.setText(body + "\n\n— FinGuard AI Financial Services");
            mailSender.send(mailMessage);
            log.info("Sent email notification to {} for subject: {}", recipientEmail, subject);
        } catch (Exception ex) {
            log.warn("Failed to send email to {} (non-fatal): {}", recipientEmail, ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUserNotifications(User user, Pageable pageable) {
        return notificationRepository.findByRecipientIdOrderByCreatedDateDesc(user.getId(), pageable)
                .map(NotificationResponse::from);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return notificationRepository.countByRecipientIdAndReadFalse(user.getId());
    }

    @Transactional
    public NotificationResponse markAsRead(Long id, User user) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not own this notification.");
        }

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return NotificationResponse.from(saved);
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadForRecipient(user.getId());
    }
}
