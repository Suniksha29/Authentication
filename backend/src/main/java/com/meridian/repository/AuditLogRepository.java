package com.meridian.repository;

import com.meridian.domain.AuditAction;
import com.meridian.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a " +
           "WHERE (:action IS NULL OR a.action = :action) " +
           "AND (:actorEmail IS NULL OR LOWER(a.actorEmail) LIKE LOWER(CONCAT('%', :actorEmail, '%'))) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findWithFilters(
            @Param("action") AuditAction action,
            @Param("actorEmail") String actorEmail,
            Pageable pageable
    );

    List<AuditLog> findTop10ByOrderByCreatedAtDesc();
}

