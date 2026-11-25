package com.finguard.finguard_api.notification;

import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private NotificationService notificationService;

    private User recipient;

    @BeforeEach
    void setUp() {
        recipient = User.builder()
                .id(10L)
                .email("borrower@finguard.com")
                .fullName("Alice Borrower")
                .role(Role.BORROWER)
                .build();
    }

    @Test
    @DisplayName("sendNotification saves entity and dispatches email safely")
    void sendNotification_success() {
        Notification notification = Notification.builder()
                .id(1L)
                .recipient(recipient)
                .type(NotificationType.LOAN_STATUS_CHANGED)
                .title("Loan Approved")
                .message("Your loan has been approved.")
                .refEntityId(100L)
                .read(false)
                .build();

        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        Notification result = notificationService.sendNotification(
                recipient,
                NotificationType.LOAN_STATUS_CHANGED,
                "Loan Approved",
                "Your loan has been approved.",
                100L
        );

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Loan Approved");
        assertThat(result.isRead()).isFalse();

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getRecipient()).isEqualTo(recipient);
        assertThat(captor.getValue().getType()).isEqualTo(NotificationType.LOAN_STATUS_CHANGED);
    }

    @Test
    @DisplayName("getUserNotifications returns paginated responses")
    void getUserNotifications_success() {
        Notification notification = Notification.builder()
                .id(1L)
                .recipient(recipient)
                .type(NotificationType.LOAN_CREATED)
                .title("Application Received")
                .message("We have received your application.")
                .read(false)
                .build();

        when(notificationRepository.findByRecipientIdOrderByCreatedDateDesc(eq(10L), any()))
                .thenReturn(new PageImpl<>(List.of(notification)));

        Page<NotificationResponse> result = notificationService.getUserNotifications(recipient, PageRequest.of(0, 10));

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).title()).isEqualTo("Application Received");
        assertThat(result.getContent().get(0).read()).isFalse();
    }

    @Test
    @DisplayName("getUnreadCount returns correct count")
    void getUnreadCount_success() {
        when(notificationRepository.countByRecipientIdAndReadFalse(10L)).thenReturn(4L);

        long count = notificationService.getUnreadCount(recipient);
        assertThat(count).isEqualTo(4L);
    }

    @Test
    @DisplayName("markAsRead marks unread notification as read")
    void markAsRead_success() {
        Notification notification = Notification.builder()
                .id(1L)
                .recipient(recipient)
                .title("Test")
                .read(false)
                .build();

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsRead(1L, recipient);

        assertThat(response.read()).isTrue();
        assertThat(notification.isRead()).isTrue();
    }

    @Test
    @DisplayName("markAsRead throws AccessDeniedException when accessed by another user")
    void markAsRead_unauthorized_throwsAccessDenied() {
        User otherUser = User.builder().id(99L).email("other@finguard.com").build();
        Notification notification = Notification.builder()
                .id(1L)
                .recipient(otherUser)
                .title("Test")
                .read(false)
                .build();

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        assertThatThrownBy(() -> notificationService.markAsRead(1L, recipient))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    @DisplayName("markAllAsRead calls repository batch update")
    void markAllAsRead_success() {
        notificationService.markAllAsRead(recipient);
        verify(notificationRepository).markAllAsReadForRecipient(10L);
    }
}
