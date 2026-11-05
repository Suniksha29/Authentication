package com.meridian.domain;

public enum Role {
    ADMIN,
    HR,
    MANAGER,
    EMPLOYEE;

    public String toAuthority() {
        return "ROLE_" + this.name();
    }
}

