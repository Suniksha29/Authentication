-- Flyway V4: Fix Identity Sequences for Employees and Departments after V2 Manual Seeding

ALTER TABLE employees ALTER COLUMN id RESTART WITH 100;
ALTER TABLE departments ALTER COLUMN id RESTART WITH 20;

