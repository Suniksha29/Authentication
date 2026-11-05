package com.meridian.controller;

import com.meridian.domain.EmploymentStatus;
import com.meridian.domain.Role;
import com.meridian.dto.*;
import com.meridian.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@Tag(name = "Employee Directory & Management", description = "Endpoints for employee directory search and HR/Admin management")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Search employee directory with pagination and filters")
    public ResponseEntity<ApiResponse<Page<EmployeeSummaryDto>>> searchEmployees(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) EmploymentStatus status,
            @PageableDefault(size = 10, sort = "lastName", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        Page<EmployeeSummaryDto> page = employeeService.searchEmployees(query, departmentId, role, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get employee details by ID")
    public ResponseEntity<ApiResponse<EmployeeDetailDto>> getEmployeeById(@PathVariable Long id) {
        EmployeeDetailDto detail = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Create and authorize employee by email (HR/Admin)")
    public ResponseEntity<ApiResponse<EmployeeDetailDto>> createEmployee(
            @Valid @RequestBody CreateEmployeeRequest request
    ) {
        EmployeeDetailDto created = employeeService.createEmployee(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Employee registered and authorized successfully.", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Update employee role, department, or status (HR/Admin)")
    public ResponseEntity<ApiResponse<EmployeeDetailDto>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEmployeeRequest request
    ) {
        EmployeeDetailDto updated = employeeService.updateEmployee(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Employee updated successfully.", updated));
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Deactivate employee account to immediately block login (HR/Admin)")
    public ResponseEntity<ApiResponse<EmployeeDetailDto>> deactivateEmployee(@PathVariable Long id) {
        EmployeeDetailDto deactivated = employeeService.deactivateEmployee(id);
        return ResponseEntity.ok(ApiResponse.ok("Employee account deactivated.", deactivated));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "Activate employee account to grant login access (HR/Admin)")
    public ResponseEntity<ApiResponse<EmployeeDetailDto>> activateEmployee(@PathVariable Long id) {
        EmployeeDetailDto activated = employeeService.activateEmployee(id);
        return ResponseEntity.ok(ApiResponse.ok("Employee account activated.", activated));
    }

    @GetMapping("/meta/departments")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "List all company departments")
    public ResponseEntity<ApiResponse<List<DepartmentDto>>> getDepartments() {
        return ResponseEntity.ok(ApiResponse.ok(employeeService.getAllDepartments()));
    }

    @GetMapping("/meta/managers")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    @Operation(summary = "List potential managers for organizational assignment")
    public ResponseEntity<ApiResponse<List<EmployeeSummaryDto>>> getManagers() {
        return ResponseEntity.ok(ApiResponse.ok(employeeService.getManagersList()));
    }
}

