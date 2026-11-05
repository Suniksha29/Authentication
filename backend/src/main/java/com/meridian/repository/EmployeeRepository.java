package com.meridian.repository;

import com.meridian.domain.Employee;
import com.meridian.domain.EmploymentStatus;
import com.meridian.domain.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

    @Query("SELECT e FROM Employee e JOIN FETCH e.department LEFT JOIN FETCH e.manager WHERE LOWER(e.email) = LOWER(:email)")
    Optional<Employee> findByEmailWithDepartmentAndManager(@Param("email") String email);

    Optional<Employee> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT e FROM Employee e JOIN FETCH e.department LEFT JOIN FETCH e.manager WHERE e.id = :id")
    Optional<Employee> findByIdWithDepartmentAndManager(@Param("id") Long id);

    @Query(value = "SELECT e FROM Employee e JOIN FETCH e.department LEFT JOIN FETCH e.manager " +
           "WHERE (:status IS NULL OR e.status = :status) " +
           "AND (:role IS NULL OR e.role = :role) " +
           "AND (:departmentId IS NULL OR e.department.id = :departmentId) " +
           "AND (:query IS NULL OR (" +
           "LOWER(e.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.jobTitle) LIKE LOWER(CONCAT('%', :query, '%'))))",
           countQuery = "SELECT COUNT(e) FROM Employee e " +
           "WHERE (:status IS NULL OR e.status = :status) " +
           "AND (:role IS NULL OR e.role = :role) " +
           "AND (:departmentId IS NULL OR e.department.id = :departmentId) " +
           "AND (:query IS NULL OR (" +
           "LOWER(e.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.jobTitle) LIKE LOWER(CONCAT('%', :query, '%'))))")
    Page<Employee> searchEmployees(
            @Param("query") String query,
            @Param("departmentId") Long departmentId,
            @Param("role") Role role,
            @Param("status") EmploymentStatus status,
            Pageable pageable
    );

    @Query("SELECT e FROM Employee e JOIN FETCH e.department LEFT JOIN FETCH e.manager WHERE e.manager.id = :managerId")
    List<Employee> findByManagerIdWithDepartment(@Param("managerId") Long managerId);

    long countByStatus(EmploymentStatus status);

    @Query("SELECT e.department.name, COUNT(e) FROM Employee e WHERE e.status = 'ACTIVE' GROUP BY e.department.name")
    List<Object[]> countActiveEmployeesByDepartment();
}

