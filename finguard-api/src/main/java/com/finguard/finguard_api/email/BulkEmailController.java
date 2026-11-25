package com.finguard.finguard_api.email;

import com.finguard.finguard_api.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/emails")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class BulkEmailController {

    private final BulkEmailService bulkEmailService;

    @PostMapping("/send")
    public ResponseEntity<BulkEmailResponse> send(
            @Valid @RequestBody BulkEmailRequest request,
            @AuthenticationPrincipal User admin
    ) {
        return ResponseEntity.ok(bulkEmailService.send(request, admin));
    }
}
