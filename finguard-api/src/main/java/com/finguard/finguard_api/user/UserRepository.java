package com.finguard.finguard_api.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByActiveTrueAndRoleIn(Collection<Role> roles);
    boolean existsByEmail(String email);
}
