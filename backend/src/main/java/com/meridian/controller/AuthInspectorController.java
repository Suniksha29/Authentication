package com.meridian.controller;

import com.meridian.dto.ApiResponse;
import com.meridian.dto.AuthInspectorTraceDto;
import com.meridian.security.inspector.AuthFlowInspectorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/inspector")
@Tag(name = "Auth Flow Inspector", description = "Endpoints for inspecting OAuth2/OIDC exchange and authorization stages")
public class AuthInspectorController {

    private final AuthFlowInspectorService inspectorService;

    public AuthInspectorController(AuthFlowInspectorService inspectorService) {
        this.inspectorService = inspectorService;
    }

    @GetMapping("/latest")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get latest authentication flow trace (Admin only)")
    public ResponseEntity<ApiResponse<AuthInspectorTraceDto>> getLatestTrace(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        AuthInspectorTraceDto trace = inspectorService.getLatestTrace(email);
        return ResponseEntity.ok(ApiResponse.ok(trace));
    }

    @GetMapping("/demo")
    @Operation(summary = "Get demonstration authentication trace for educational walkthrough (Public / Demo Mode)")
    public ResponseEntity<ApiResponse<AuthInspectorTraceDto>> getDemoTrace() {
        AuthInspectorTraceDto demoTrace = inspectorService.generateDemoTrace();
        return ResponseEntity.ok(ApiResponse.ok(demoTrace));
    }
}

