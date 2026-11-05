# Meridian Enterprise Portal - Complete Live Demo Script

This document provides a step-by-step walkthrough demonstrating Google OAuth 2.0 / OpenID Connect authentication and Meridian role-based authorization across all 6 core enterprise scenarios.

---

## Scenario Index
- **Scenario 1**: Login with an Authorized Google Account
- **Scenario 2**: Login with an Unregistered Google Account &rarr; Access Denied
- **Scenario 3**: HR Authorizes That Email &rarr; Login Immediately Succeeds
- **Scenario 4**: HR Deactivates the Employee &rarr; Login Immediately Blocked
- **Scenario 5**: Role-Based Authorization Enforcement &rarr; Employee Blocked from Admin (HTTP 403)
- **Scenario 6**: The 10-Stage Auth Flow Inspector Walkthrough

---

## Pre-Requisites & Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` from your Google Cloud Console.
3. Set your own personal/corporate Google email in `.env` as the initial bootstrap admin:
   ```env
   BOOTSTRAP_ADMIN_EMAIL=your.real.google.email@gmail.com
   ```
4. Start the stack:
   ```bash
   docker compose up --build
   # Or locally: java -jar backend/target/meridian-backend-1.0.0.jar
   ```
5. Open your browser at [http://localhost:8080](http://localhost:8080).

---

## Scenario 1: Login with an Authorized Google Account

**Objective**: Verify that a Google account present in the `employees` table with `status = ACTIVE` is authenticated, role-mapped, issued a Redis-backed session, and granted access to the Dashboard.

### Steps:
1. Open [http://localhost:8080/login](http://localhost:8080/login).
2. Note the clean, distraction-free enterprise login screen:
   - Only the **"Continue with Google"** button and enterprise identity subtext.
3. Click **"Continue with Google"**.
4. You are redirected to Google's OAuth 2.0 consent screen with PKCE parameters:
   - Notice the URL begins with `https://accounts.google.com/o/oauth2/v2/auth`.
   - Requested scopes: `openid profile email`.
5. Select the Google account matching `BOOTSTRAP_ADMIN_EMAIL`.
6. Google returns to `http://localhost:8080/login/oauth2/code/google`.
7. Meridian validates the ID token, looks up your email in PostgreSQL, maps the `ADMIN` role, and redirects to `/dashboard`.
8. **Verification**:
   - The top navigation bar displays your Google profile name and an `ADMIN` role badge.
   - The security indicator displays: `Google OIDC + PKCE | Redis Session`.
   - The Dashboard renders real live headcount figures, active department distribution, and pending leave approvals.

---

## Scenario 2: Login with an Unregistered Google Account &rarr; Access Denied

**Objective**: Prove the fundamental identity concept: **Authentication ≠ Authorization**. Having a valid Google account does not grant access unless authorized by Meridian.

### Steps:
1. Sign out of Meridian via the bottom-left logout icon.
2. Sign in with a **different** Google account (e.g. your personal `@gmail.com` or a colleague's account that has NOT been added to the employees database).
3. Google authenticates the account and signs the ID token.
4. The token reaches Meridian's `MeridianOidcUserService`.
5. The backend confirms `email_verified=true` and issuer=`https://accounts.google.com`, but the query `SELECT * FROM employees WHERE email = ?` returns empty.
6. The backend throws `UnauthorizedEmployeeException`, logs a `LOGIN_DENIED` security audit event with client IP and User-Agent, and redirects to `/access-denied`.
7. **Verification**:
   - You land on `http://localhost:8080/access-denied?error=not_found&email=...`.
   - The card prominently shows:
     - **Attempted Identity**: The exact Google email you tried.
     - **Reason**: *Employee Record Not Found in Meridian Directory*.
     - **Explanation**: Explains that identity was verified by Google, but authorization was denied.
     - A **"Sign in with a different Google account"** button.

---

## Scenario 3: HR Adds the Email &rarr; Login Immediately Succeeds

**Objective**: Demonstrate that adding an employee email immediately authorizes that Google account to access the portal.

### Steps:
1. Return to the portal and log back in with your Admin account.
2. From the sidebar, click **"Manage Employees"** (`/employees`).
3. Click the top-right button: **"Authorize New Employee"**.
4. In the modal dialog, fill in:
   - **Google Account Email**: The exact unregistered Google email from Scenario 2 (e.g. `colleague@gmail.com`).
   - **First Name**: `Alex`
   - **Last Name**: `Rivera`
   - **Job Title**: `Staff Security Engineer`
   - **System Role**: Select `EMPLOYEE` (or `MANAGER`).
   - **Department**: `Engineering`
5. Click **"Authorize Employee"**.
6. A toast confirmation confirms: *"Employee Alex Rivera (colleague@gmail.com) authorized to log in!"*.
7. In the sidebar or top bar, click Logout.
8. Now, click **"Continue with Google"** and sign in with `colleague@gmail.com`.
9. **Verification**:
   - The login **succeeds immediately without server restart**.
   - Alex lands on `/dashboard` with `ROLE_EMPLOYEE`.
   - They can view the Employee Directory and submit leave requests.

---

## Scenario 4: HR Deactivates the Account &rarr; Login Immediately Blocked

**Objective**: Demonstrate immediate revocation of access without needing to revoke Google credentials.

### Steps:
1. Sign back in with the Admin account.
2. Navigate to **"Manage Employees"** (`/employees`).
3. Locate `colleague@gmail.com` in the table.
4. Click the red **"Deactivate"** button.
5. In the confirmation dialog, review the warning:
   - *"When this employee attempts to authenticate via Google, our backend OidcUserService will detect the INACTIVE status and throw an InactiveEmployeeException, redirecting them directly to Access Denied."*
6. Click **"Confirm Deactivation"**.
7. The status badge immediately updates from `ACTIVE` to `INACTIVE`.
8. An audit log entry `EMPLOYEE_DEACTIVATED` is written to the immutable audit table.
9. Log out of Admin.
10. Attempt to sign in again with `colleague@gmail.com`.
11. **Verification**:
    - You are immediately blocked and redirected to:
      `http://localhost:8080/access-denied?error=inactive&email=colleague@gmail.com`
    - The page clearly informs the user:
      - **Account Inactive or Deactivated**: *"Your Google account was recognized, but your Meridian employee record has been marked as INACTIVE."*

---

## Scenario 5: Role-Based Authorization & Method Security (HTTP 403)

**Objective**: Demonstrate that Spring Security `@PreAuthorize` protects privileged endpoints and returns proper HTTP 403 Forbidden without leaking stack traces.

### Steps:
1. Sign in with an account having role `EMPLOYEE` (e.g. `samuel.kim@meridian.internal` or any employee created in Scenario 3).
2. Note that the sidebar dynamically adapts: the **"Manage Employees"** and **"Audit Logs"** links are hidden from standard employees.
3. Try directly browsing to the Admin-only Audit Logs URL:
   [http://localhost:8080/audit-logs](http://localhost:8080/audit-logs)
4. The client-side route guard detects insufficient role permissions and redirects to `/access-denied?error=forbidden`.
5. Open browser DevTools (F12) > Network Tab, or run `curl`:
   ```bash
   # Attempt to call Admin API with an Employee session cookie
   curl -i -X GET http://localhost:8080/api/audit-logs \
     -H "Accept: application/json" \
     -H "Cookie: SESSION=..."
   ```
6. **Verification**:
   - The backend responds with strict HTTP `403 Forbidden`.
   - Response payload:
     ```json
     {
       "status": 403,
       "error": "Forbidden",
       "message": "Access Denied: Your assigned role does not grant sufficient authority to perform this operation.",
       "timestamp": "2026-11-04T..."
     }
     ```
   - Zero internal server stack traces or database structures are leaked.

---

## Scenario 6: The Auth Flow Inspector Walkthrough

**Objective**: Walk a non-expert audience through the interactive 10-stage timeline explaining how Google OAuth 2.0, OpenID Connect, PKCE, claims verification, and role mapping work together.

### Steps:
1. Sign in as Admin and navigate to **"Auth Flow Inspector"** in the sidebar (or visit [http://localhost:8080/auth-inspector](http://localhost:8080/auth-inspector)).
2. Note the two modes at the top right:
   - **Live Session Trace**: Displays the real-time execution trace captured during your last login.
   - **Demo Walkthrough**: Provides an interactive simulation demonstrating a golden-path enterprise login.
3. Review the **10 Pipeline Stages**:
   - **Stage 1 (Client): Client Authorization Request (PKCE)**
     - Explains how Spring Security generated `code_verifier` and SHA-256 `code_challenge` to mitigate authorization code interception.
   - **Stage 2 (Google IdP): Google OpenID Connect Consent**
     - Explains user authentication on Google servers and consent for basic profile and email scopes.
   - **Stage 3 (Client): Authorization Code Delivery**
     - Explains callback redirection to `/login/oauth2/code/google` with single-use authorization code and state parameter.
   - **Stage 4 (Backend): Back-Channel Token Exchange**
     - Emphasizes that code exchange happens directly between Meridian backend and Google's token endpoint over HTTPS. Client secret is never exposed to the browser.
   - **Stage 5 (Backend): ID Token Cryptographic Verification**
     - Highlights public key retrieval from Google JWKS (`https://www.googleapis.com/oauth2/v3/certs`) and RS256 signature verification.
   - **Stage 6 (Backend): OIDC Claims Policy Check**
     - Explains verification of `iss` (`https://accounts.google.com`), `aud` matching OAuth client ID, token expiration, and `email_verified == true`.
   - **Stage 7 (Authorization): Meridian Database Lookup**
     - Shows the exact database query checking whether the authenticated Google email exists in Meridian's employee table.
   - **Stage 8 (Authorization): Role-Based Authorization**
     - Shows how the organizational role (`ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`) was mapped to Spring Security `GrantedAuthority`.
   - **Stage 9 (Session): Enterprise Distributed Session**
     - Highlights generation of the `SESSION` cookie stored in Redis with `HttpOnly; SameSite=Lax`, fixation protection, and 30-minute idle expiration.
   - **Stage 10 (Audit): Security Audit Logging**
     - Confirms structured recording of `LOGIN_SUCCESS` in the database.
4. Click on **Stage 5 or 6** to inspect the technical parameters in the live terminal view.
5. In the bottom cards, review:
   - **Validated Google ID Token Claims**: Full decoded JWT claims with sensitive tokens and subject hashes masked (`sub: 1098••••••••`).
   - **Stateful Session Configuration**: Redis session key hash, cookie attributes, and timeouts.

