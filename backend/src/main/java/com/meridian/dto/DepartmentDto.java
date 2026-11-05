package com.meridian.dto;

import com.meridian.domain.Department;

public record DepartmentDto(
        Long id,
        String name,
        String code
) {
    public static DepartmentDto fromEntity(Department department) {
        if (department == null) return null;
        return new DepartmentDto(department.getId(), department.getName(), department.getCode());
    }
}

