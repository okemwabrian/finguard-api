package com.finguard.finguard_api.user;

import com.finguard.finguard_api.security.JwtService;
import com.finguard.finguard_api.user.dto.ChangePasswordRequest;
import com.finguard.finguard_api.user.dto.LoginRequest;
import com.finguard.finguard_api.user.dto.LoginResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (BadCredentialsException e) {
            userRepository.findByEmail(request.email()).ifPresent(user -> {
                int attempts = user.getFailedLoginAttempts() + 1;
                user.setFailedLoginAttempts(attempts);
                if (attempts >= 5) {
                    user.setActive(false);
                }
                userRepository.save(user);
            });
            throw e;
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(new LoginResponse(
                token,
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isMustChangePassword()
        ));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        if (!passwordEncoder.matches(request.currentPassword(), currentUser.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect"));
        }

        currentUser.setPassword(passwordEncoder.encode(request.newPassword()));
        currentUser.setMustChangePassword(false);
        userRepository.save(currentUser);

        String newToken = jwtService.generateToken(currentUser);
        return ResponseEntity.ok(Map.of(
                "message", "Password updated successfully. You now have full access.",
                "token", newToken
        ));
    }
}
