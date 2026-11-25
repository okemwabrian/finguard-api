package com.finguard.finguard_api.config;

import com.finguard.finguard_api.audit.AuditLogService;
import com.finguard.finguard_api.user.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class SiteConfigController {

    private final SiteConfigRepository siteConfigRepository;
    private final AuditLogService auditLogService;

    public record UpdateSiteConfigRequest(
            @Pattern(regexp = "VAULT_3D|ANALYTICS_ORBIT|CARD_STACK_3D")
            String heroModel,
            @Size(max = 120)
            String heroBadge,
            @Size(max = 180)
            String heroTitle,
            @Size(max = 500)
            String heroSubtitle
    ) {}

    @GetMapping("/api/public/site-config")
    public ResponseEntity<SiteConfig> getPublicConfig() {
        SiteConfig config = siteConfigRepository.findById(1L)
                .orElseGet(() -> siteConfigRepository.save(SiteConfig.builder().id(1L).build()));
        return ResponseEntity.ok(config);
    }

    @PutMapping("/api/admin/site-config")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SiteConfig> updateConfig(
            @Valid @RequestBody UpdateSiteConfigRequest request,
            @AuthenticationPrincipal User admin
    ) {
        SiteConfig config = siteConfigRepository.findById(1L)
                .orElseGet(() -> SiteConfig.builder().id(1L).build());

        if (request.heroModel() != null && !request.heroModel().isBlank()) {
            config.setHeroModel(request.heroModel().trim());
        }
        if (request.heroBadge() != null && !request.heroBadge().isBlank()) {
            config.setHeroBadge(request.heroBadge().trim());
        }
        if (request.heroTitle() != null && !request.heroTitle().isBlank()) {
            config.setHeroTitle(request.heroTitle().trim());
        }
        if (request.heroSubtitle() != null && !request.heroSubtitle().isBlank()) {
            config.setHeroSubtitle(request.heroSubtitle().trim());
        }

        SiteConfig saved = siteConfigRepository.save(config);
        auditLogService.record(
                "SITE_CONFIG_UPDATED",
                "SITE_CONFIG",
                1L,
                admin,
                "Updated landing page 3D showcase model to " + saved.getHeroModel()
        );
        return ResponseEntity.ok(saved);
    }
}
