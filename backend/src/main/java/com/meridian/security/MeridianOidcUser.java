package com.meridian.security;

import com.meridian.domain.Employee;
import com.meridian.domain.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.util.Collection;
import java.util.Map;

public class MeridianOidcUser implements OidcUser {

    private final OidcUser delegate;
    private final Employee employee;
    private final Collection<? extends GrantedAuthority> authorities;

    public MeridianOidcUser(OidcUser delegate, Employee employee, Collection<? extends GrantedAuthority> authorities) {
        this.delegate = delegate;
        this.employee = employee;
        this.authorities = authorities;
    }

    public Employee getEmployee() {
        return employee;
    }

    public Long getEmployeeId() {
        return employee != null ? employee.getId() : null;
    }

    public Role getRole() {
        return employee != null ? employee.getRole() : null;
    }

    @Override
    public Map<String, Object> getClaims() {
        return delegate.getClaims();
    }

    @Override
    public OidcUserInfo getUserInfo() {
        return delegate.getUserInfo();
    }

    @Override
    public OidcIdToken getIdToken() {
        return delegate.getIdToken();
    }

    @Override
    public Map<String, Object> getAttributes() {
        return delegate.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getName() {
        return employee != null ? employee.getFullName() : delegate.getName();
    }

    @Override
    public String getEmail() {
        return employee != null ? employee.getEmail() : delegate.getEmail();
    }
}

