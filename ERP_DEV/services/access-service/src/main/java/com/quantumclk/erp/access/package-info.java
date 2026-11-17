/**
 * access-service: employee profiles and Keycloak account management for the Golden Hills Resort ERP.
 *
 * <p>SOW ERP-08 (user management, role-based access); Phase 1 Blueprint "Access Control" service.
 * Keycloak (realm gh-staff) owns credentials, sessions and account status; this service stores
 * profiles linked by the Keycloak user id and never stores passwords, OTPs or tokens (ADR-002).
 * Design: docs/02-architecture/identity/AUTHENTICATION.md.
 */
package com.quantumclk.erp.access;
