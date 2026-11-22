package com.finguard.finguard_api.security;

import com.finguard.finguard_api.user.Role;
import com.finguard.finguard_api.user.User;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret",
                "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 3600000L);

        testUser = User.builder()
                .id(1L)
                .fullName("Jane Officer")
                .email("jane@finguard.com")
                .role(Role.LOAN_OFFICER)
                .mustChangePassword(false)
                .build();
    }

    @Test
    void shouldGenerateAndValidateTokenForUser() {
        String token = jwtService.generateToken(testUser);

        assertNotNull(token);
        assertEquals("jane@finguard.com", jwtService.extractUsername(token));
        assertTrue(jwtService.isTokenValid(token, testUser));
    }

    @Test
    void shouldRejectTokenForDifferentUser() {
        String token = jwtService.generateToken(testUser);

        User otherUser = User.builder()
                .email("attacker@finguard.com")
                .role(Role.LOAN_OFFICER)
                .build();

        assertFalse(jwtService.isTokenValid(token, otherUser));
    }

    @Test
    void shouldRejectExpiredToken() {
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", -1000L);
        String expiredToken = jwtService.generateToken(testUser);

        assertThrows(ExpiredJwtException.class, () -> jwtService.isTokenValid(expiredToken, testUser));
    }
}
