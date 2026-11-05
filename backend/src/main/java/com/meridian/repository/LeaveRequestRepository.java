package com.meridian.repository;

import com.meridian.domain.LeaveRequest;
import com.meridian.domain.LeaveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    @Query("SELECT lr FROM LeaveRequest lr " +
           "JOIN FETCH lr.employee e " +
           "JOIN FETCH e.department " +
           "LEFT JOIN FETCH lr.reviewer " +
           "WHERE lr.id = :id")
    Optional<LeaveRequest> findByIdWithDetails(@Param("id") Long id);

    @Query(value = "SELECT lr FROM LeaveRequest lr " +
           "JOIN FETCH lr.employee e " +
           "JOIN FETCH e.department " +
           "LEFT JOIN FETCH lr.reviewer " +
           "WHERE (:status IS NULL OR lr.status = :status)",
           countQuery = "SELECT COUNT(lr) FROM LeaveRequest lr WHERE (:status IS NULL OR lr.status = :status)")
    Page<LeaveRequest> findAllWithDetails(@Param("status") LeaveStatus status, Pageable pageable);

    @Query(value = "SELECT lr FROM LeaveRequest lr " +
           "JOIN FETCH lr.employee e " +
           "JOIN FETCH e.department " +
           "LEFT JOIN FETCH lr.reviewer " +
           "WHERE lr.employee.id = :employeeId " +
           "AND (:status IS NULL OR lr.status = :status)",
           countQuery = "SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.employee.id = :employeeId AND (:status IS NULL OR lr.status = :status)")
    Page<LeaveRequest> findByEmployeeId(@Param("employeeId") Long employeeId, @Param("status") LeaveStatus status, Pageable pageable);

    @Query(value = "SELECT lr FROM LeaveRequest lr " +
           "JOIN FETCH lr.employee e " +
           "JOIN FETCH e.department " +
           "LEFT JOIN FETCH lr.reviewer " +
           "WHERE e.manager.id = :managerId " +
           "AND (:status IS NULL OR lr.status = :status)",
           countQuery = "SELECT COUNT(lr) FROM LeaveRequest lr JOIN lr.employee e WHERE e.manager.id = :managerId AND (:status IS NULL OR lr.status = :status)")
    Page<LeaveRequest> findByManagerId(@Param("managerId") Long managerId, @Param("status") LeaveStatus status, Pageable pageable);

    long countByStatus(LeaveStatus status);

    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.employee.manager.id = :managerId AND lr.status = 'PENDING'")
    long countPendingByManagerId(@Param("managerId") Long managerId);
}

