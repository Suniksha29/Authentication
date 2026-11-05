package com.meridian;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meridian.domain.Role;
import com.meridian.dto.CreateEmployeeRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Requirement: Unauthenticated API call returns 401 Unauthorized")
    void unauthenticatedReturns401() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));

        mockMvc.perform(get("/api/employees")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/dashboard/summary")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Requirement: Authorized employee returns 200 OK")
    @WithMockUser(username = "samuel.kim@meridian.internal", roles = {"EMPLOYEE"})
    void authorizedEmployeeReturns200() throws Exception {
        mockMvc.perform(get("/api/employees")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/dashboard/summary")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Requirement: Role-based 403s - EMPLOYEE denied Admin endpoints")
    @WithMockUser(username = "samuel.kim@meridian.internal", roles = {"EMPLOYEE"})
    void employeeCannotAccessAdminAuditLogs() throws Exception {
        mockMvc.perform(get("/api/audit-logs")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("Requirement: Role-based 403s - EMPLOYEE denied creating employees")
    @WithMockUser(username = "samuel.kim@meridian.internal", roles = {"EMPLOYEE"})
    void employeeCannotCreateEmployee() throws Exception {
        CreateEmployeeRequest request = new CreateEmployeeRequest(
                "new.hire@meridian.internal", "New", "Hire", "Engineer",
                Role.EMPLOYEE, 2L, null, null, null
        );

        mockMvc.perform(post("/api/employees")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Requirement: ADMIN role granted access to Audit Logs")
    @WithMockUser(username = "admin@meridian.internal", roles = {"ADMIN"})
    void adminCanAccessAuditLogs() throws Exception {
        mockMvc.perform(get("/api/audit-logs")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray());
    }

    @Test
    @DisplayName("Requirement: HR role granted access to create employees")
    @WithMockUser(username = "elena.rostova@meridian.internal", roles = {"HR"})
    void hrCanCreateEmployee() throws Exception {
        CreateEmployeeRequest request = new CreateEmployeeRequest(
                "test.candidate@meridian.internal", "Test", "Candidate", "Security Specialist",
                Role.EMPLOYEE, 2L, null, "+1-555-9999", null
        );

        mockMvc.perform(post("/api/employees")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("test.candidate@meridian.internal"));
    }

    @Test
    @DisplayName("Requirement: OWASP CSRF Protection rejects state-changing requests without CSRF token")
    @WithMockUser(username = "admin@meridian.internal", roles = {"ADMIN"})
    void missingCsrfTokenReturns403() throws Exception {
        CreateEmployeeRequest request = new CreateEmployeeRequest(
                "no.csrf@meridian.internal", "No", "Csrf", "Tester",
                Role.EMPLOYEE, 2L, null, null, null
        );

        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
