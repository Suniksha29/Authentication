-- Flyway V2: Seed 8 Departments and 28 Realistic Employees with Hierarchy

INSERT INTO departments (id, name, code) VALUES
(1, 'Executive Leadership', 'EXEC'),
(2, 'Engineering', 'ENG'),
(3, 'Human Resources', 'HR'),
(4, 'Product & Design', 'PROD'),
(5, 'Finance & Accounting', 'FIN'),
(6, 'Operations & Security', 'OPS'),
(7, 'Sales & Marketing', 'MKTG'),
(8, 'Customer Support', 'SUPP');

-- Employees
-- Default bootstrap admin: admin@meridian.internal
INSERT INTO employees (id, email, first_name, last_name, job_title, role, status, department_id, manager_id, avatar_url, phone, hire_date) VALUES
-- Exec & Admin
(1, 'admin@meridian.internal', 'Marcus', 'Vance', 'Chief Information Officer', 'ADMIN', 'ACTIVE', 1, NULL, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '+1-555-0101', '2021-01-15'),
(2, 'sarah.jenkins@meridian.internal', 'Sarah', 'Jenkins', 'Chief Executive Officer', 'ADMIN', 'ACTIVE', 1, NULL, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', '+1-555-0102', '2020-03-01'),

-- HR Team (Role: HR)
(3, 'elena.rostova@meridian.internal', 'Elena', 'Rostova', 'VP of People Operations', 'HR', 'ACTIVE', 3, 2, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', '+1-555-0103', '2021-04-10'),
(4, 'david.chen@meridian.internal', 'David', 'Chen', 'Senior HR Operations Manager', 'HR', 'ACTIVE', 3, 3, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '+1-555-0104', '2022-01-12'),
(5, 'priya.sharma@meridian.internal', 'Priya', 'Sharma', 'Talent Acquisition Partner', 'HR', 'ACTIVE', 3, 4, 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150', '+1-555-0105', '2022-06-15'),
(6, 'jordan.taylor@meridian.internal', 'Jordan', 'Taylor', 'HR Coordinator', 'HR', 'ACTIVE', 3, 4, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '+1-555-0106', '2023-08-01'),

-- Engineering Managers & Leads (Role: MANAGER)
(7, 'alex.mercer@meridian.internal', 'Alex', 'Mercer', 'VP of Engineering', 'MANAGER', 'ACTIVE', 2, 2, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', '+1-555-0107', '2021-02-01'),
(8, 'claire.dubois@meridian.internal', 'Claire', 'Dubois', 'Director of Cloud Infrastructure', 'MANAGER', 'ACTIVE', 2, 7, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', '+1-555-0108', '2021-07-15'),
(9, 'rachel.adams@meridian.internal', 'Rachel', 'Adams', 'Principal Architect - Core Systems', 'MANAGER', 'ACTIVE', 2, 7, 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150', '+1-555-0109', '2021-11-20'),

-- Product Managers (Role: MANAGER)
(10, 'tarik.mansoor@meridian.internal', 'Tarik', 'Mansoor', 'Head of Product Management', 'MANAGER', 'ACTIVE', 4, 2, 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150', '+1-555-0110', '2021-05-18'),

-- Finance Manager
(11, 'victoria.sterling@meridian.internal', 'Victoria', 'Sterling', 'Chief Financial Officer', 'MANAGER', 'ACTIVE', 5, 2, 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=150', '+1-555-0111', '2020-09-01'),

-- Engineers (Role: EMPLOYEE)
(12, 'samuel.kim@meridian.internal', 'Samuel', 'Kim', 'Senior Distributed Systems Engineer', 'EMPLOYEE', 'ACTIVE', 2, 8, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', '+1-555-0112', '2022-03-01'),
(13, 'maya.lin@meridian.internal', 'Maya', 'Lin', 'Full Stack Security Engineer', 'EMPLOYEE', 'ACTIVE', 2, 8, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '+1-555-0113', '2022-04-15'),
(14, 'liam.o-connor@meridian.internal', 'Liam', 'O''Connor', 'Site Reliability Engineer', 'EMPLOYEE', 'ACTIVE', 2, 8, 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', '+1-555-0114', '2022-08-10'),
(15, 'aisha.al-mansoori@meridian.internal', 'Aisha', 'Al-Mansoori', 'Staff Backend Engineer', 'EMPLOYEE', 'ACTIVE', 2, 9, 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=150', '+1-555-0115', '2022-10-05'),
(16, 'nathan.drake@meridian.internal', 'Nathan', 'Drake', 'Senior Frontend Engineer', 'EMPLOYEE', 'ACTIVE', 2, 9, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', '+1-555-0116', '2023-01-16'),
(17, 'zoe.kravitz@meridian.internal', 'Zoe', 'Kravitz', 'Frontend Software Engineer', 'EMPLOYEE', 'ACTIVE', 2, 9, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', '+1-555-0117', '2023-05-22'),
(18, 'lucas.silva@meridian.internal', 'Lucas', 'Silva', 'DevOps Systems Engineer', 'EMPLOYEE', 'ACTIVE', 2, 8, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', '+1-555-0118', '2023-09-01'),

-- Product & Design (Role: EMPLOYEE)
(19, 'chloe.dupont@meridian.internal', 'Chloe', 'Dupont', 'Senior Product Designer', 'EMPLOYEE', 'ACTIVE', 4, 10, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', '+1-555-0119', '2022-02-14'),
(20, 'arjun.patel@meridian.internal', 'Arjun', 'Patel', 'Product Manager - Identity & Access', 'EMPLOYEE', 'ACTIVE', 4, 10, 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150', '+1-555-0120', '2022-07-01'),
(21, 'hannah.schmidt@meridian.internal', 'Hannah', 'Schmidt', 'UX Researcher', 'EMPLOYEE', 'ACTIVE', 4, 10, 'https://images.unsplash.com/photo-1534751516642-a171edd2521d?w=150', '+1-555-0121', '2023-03-15'),

-- Finance, Ops, Marketing, Support (Role: EMPLOYEE)
(22, 'oscar.martinez@meridian.internal', 'Oscar', 'Martinez', 'Senior Financial Analyst', 'EMPLOYEE', 'ACTIVE', 5, 11, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', '+1-555-0122', '2021-10-01'),
(23, 'kevin.malone@meridian.internal', 'Kevin', 'Malone', 'Staff Accountant', 'EMPLOYEE', 'ACTIVE', 5, 11, 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150', '+1-555-0123', '2022-05-15'),
(24, 'angela.martin@meridian.internal', 'Angela', 'Martin', 'Corporate Controller', 'EMPLOYEE', 'ACTIVE', 5, 11, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', '+1-555-0124', '2021-08-20'),
(25, 'dwight.schrute@meridian.internal', 'Dwight', 'Schrute', 'Director of Physical Security', 'EMPLOYEE', 'ACTIVE', 6, 2, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '+1-555-0125', '2020-04-01'),
(26, 'jim.halpert@meridian.internal', 'Jim', 'Halpert', 'Enterprise Account Director', 'EMPLOYEE', 'ACTIVE', 7, 2, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '+1-555-0126', '2021-06-01'),
(27, 'pam.beesly@meridian.internal', 'Pam', 'Beesly', 'Customer Experience Lead', 'EMPLOYEE', 'ACTIVE', 8, 2, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', '+1-555-0127', '2021-06-15'),

-- Inactive Employee (Demonstrating Inactive Account Rejection)
(28, 'toby.flenderson@meridian.internal', 'Toby', 'Flenderson', 'Former Relations Officer', 'EMPLOYEE', 'INACTIVE', 3, 3, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', '+1-555-0128', '2020-01-10');

-- Reset identity sequence for employees
-- (PostgreSQL compatible sequence alignment)
-- H2 also handles GENERATED BY DEFAULT AS IDENTITY gracefully.

-- Seed realistic leave requests
INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, days_count, reason, status, reviewer_id, review_notes, reviewed_at, created_at) VALUES
(1, 12, 'ANNUAL', '2026-11-10', '2026-11-14', 5, 'Family vacation to Kyoto', 'PENDING', NULL, NULL, NULL, '2026-11-01 10:15:00'),
(2, 13, 'SICK', '2026-11-03', '2026-11-04', 2, 'Severe seasonal flu symptoms', 'APPROVED', 8, 'Approved. Rest well Maya.', '2026-11-03 08:30:00', '2026-11-03 07:45:00'),
(3, 16, 'ANNUAL', '2026-11-24', '2026-11-28', 5, 'Thanksgiving break with family', 'PENDING', NULL, NULL, NULL, '2026-11-02 14:20:00'),
(4, 19, 'PARENTAL', '2026-12-01', '2026-12-31', 31, 'Secondary caregiver parental leave', 'APPROVED', 10, 'Approved. All the best Chloe!', '2026-10-25 11:00:00', '2026-10-24 09:00:00'),
(5, 22, 'ANNUAL', '2026-11-18', '2026-11-20', 3, 'Personal recharge days', 'APPROVED', 11, 'Approved. Coverage confirmed with Kevin.', '2026-11-02 16:00:00', '2026-11-01 11:30:00');

-- Seed realistic audit logs
INSERT INTO audit_logs (id, action, actor_email, actor_role, target_resource, ip_address, user_agent, details, created_at) VALUES
(1, 'EMPLOYEE_CREATED', 'admin@meridian.internal', 'ADMIN', 'employees/12', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Created employee Samuel Kim (samuel.kim@meridian.internal) with role EMPLOYEE', '2026-10-01 09:00:00'),
(2, 'LOGIN_SUCCESS', 'admin@meridian.internal', 'ADMIN', 'auth/session', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Authenticated via Google OIDC. Role mapped: ADMIN', '2026-11-04 08:00:00'),
(3, 'LEAVE_APPROVED', 'claire.dubois@meridian.internal', 'MANAGER', 'leave/2', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Approved sick leave request for Maya Lin', '2026-11-03 08:30:00'),
(4, 'ROLE_CHANGED', 'admin@meridian.internal', 'ADMIN', 'employees/7', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Promoted Alex Mercer to MANAGER role', '2026-10-15 14:10:00'),
(5, 'EMPLOYEE_DEACTIVATED', 'elena.rostova@meridian.internal', 'HR', 'employees/28', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Deactivated employee Toby Flenderson upon departure', '2026-10-20 17:00:00');

-- Align IDENTITY sequences past the seeded ranges for H2 and PostgreSQL
ALTER TABLE departments ALTER COLUMN id RESTART WITH 100;
ALTER TABLE employees ALTER COLUMN id RESTART WITH 100;
ALTER TABLE leave_requests ALTER COLUMN id RESTART WITH 100;
ALTER TABLE audit_logs ALTER COLUMN id RESTART WITH 100;
