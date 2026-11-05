package com.meridian.repository;

import com.meridian.domain.AuthFlowTrace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuthFlowTraceRepository extends JpaRepository<AuthFlowTrace, String> {
    Optional<AuthFlowTrace> findTop1ByOrderByCreatedAtDesc();
    Optional<AuthFlowTrace> findTop1ByEmailOrderByCreatedAtDesc(String email);
    Page<AuthFlowTrace> findAllByOrderByCreatedAtDesc(Pageable pageable);
}

