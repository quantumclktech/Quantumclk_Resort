/**
 * api-gateway: the single entry point for API calls (Phase 1 Blueprint §12.1, ADR-005).
 *
 * <p>Routes requests to the owning service, checks the staff JWT before routing, applies rate limits
 * (Redis) and request-size limits, and propagates correlation ids. No business logic and no database.
 * Every service checks the token again on its own (defense in depth). Design: docs/02-architecture/ARCHITECTURE.md.
 */
package com.quantumclk.erp.gateway;
