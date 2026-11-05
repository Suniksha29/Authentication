package com.meridian.repository;

import com.meridian.domain.RegistrationRequest;
import com.meridian.domain.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRequestRepository extends JpaRepository<RegistrationRequest, Long> {
    Optional<RegistrationRequest> findByEmailIgnoreCase(String email);
    Optional<RegistrationRequest> findByVerificationToken(String token);
    Optional<RegistrationRequest> findByApprovalToken(String token);
    List<RegistrationRequest> findByStatusOrderByCreatedAtDesc(RegistrationStatus status);
}

