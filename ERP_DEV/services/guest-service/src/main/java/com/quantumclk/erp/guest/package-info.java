/**
 * guest-service: guest and member identity for the Golden Hills Resort website (Keycloak realm gh-guests).
 *
 * <p>SOW ERP-05 "membership portal"; decisions D-119…D-122. Keycloak owns credentials, sessions and the welcome
 * email. This service creates the member's account in gh-guests when access-service verifies a Gold Membership,
 * asks Keycloak (extension gh-member-activation) to send the welcome email with a one-time set-password link, and
 * keeps a small account record in guest_db. It stores no passwords and no membership data (memberships live in
 * access-service, D-120). Design: docs/04-modules/membership.md, docs/02-architecture/api.md.
 */
package com.quantumclk.erp.guest;
