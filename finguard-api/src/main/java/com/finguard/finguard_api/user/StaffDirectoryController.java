package com.finguard.finguard_api.user;

import com.finguard.finguard_api.user.dto.BorrowerContactResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/borrowers")
@PreAuthorize("hasAnyRole('ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'AUDITOR')")
@RequiredArgsConstructor
public class StaffDirectoryController {

    private final UserRepository userRepository;

    @GetMapping
    public List<BorrowerContactResponse> listBorrowers() {
        return userRepository.findByActiveTrueAndRoleIn(List.of(Role.USER, Role.BORROWER))
                .stream()
                .map(BorrowerContactResponse::from)
                .toList();
    }
}
