package com.finguard.finguard_api.user;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.finguard.finguard_api.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    @Value("${google.client.id:}")
    private String googleClientId;

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        String idToken = body.get("credential");
        if (idToken == null || idToken.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing Google credential."));
        }

        try {
            String response = RestClient.create()
                    .get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token={token}", idToken)
                    .retrieve()
                    .body(String.class);

            JsonNode payload = objectMapper.readTree(response);
            String aud = payload.path("aud").asText();

            if (googleClientId != null && !googleClientId.isBlank() && !googleClientId.equals("PASTE_YOUR_CLIENT_ID")) {
                if (!googleClientId.equals(aud)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body(Map.of("error", "Invalid Google client ID."));
                }
            }

            String email = payload.path("email").asText();
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Email not provided by Google."));
            }

            String fullName = payload.path("name").asText(email.split("@")[0]);

            User user = userRepository.findByEmail(email).orElseGet(() -> userRepository.save(
                    User.builder()
                            .fullName(fullName)
                            .email(email)
                            .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                            .role(Role.USER)
                            .mustChangePassword(false)
                            .active(true)
                            .build()
            ));

            if (!user.isActive()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "This account has been suspended."));
            }

            String jwt = jwtService.generateToken(user);
            return ResponseEntity.ok(Map.of(
                    "token", jwt,
                    "email", user.getEmail(),
                    "fullName", user.getFullName(),
                    "role", user.getRole().name(),
                    "mustChangePassword", user.isMustChangePassword()
            ));
        } catch (Exception ex) {
            log.warn("Google authentication failed: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Google authentication failed."));
        }
    }
}
