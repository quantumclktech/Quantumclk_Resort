-- Sign-in record for each guest/member account (D-128). Still no passwords, tokens or IP addresses here: Keycloak
-- gh-guests keeps credentials (hashed) and its own sign-in events; this is our account record and audit.

ALTER TABLE guest_account
    ADD COLUMN status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISABLED')),
    ADD COLUMN email_verified     BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN first_signed_in_at TIMESTAMPTZ,
    ADD COLUMN last_signed_in_at  TIMESTAMPTZ,
    ADD COLUMN sign_in_count      INT         NOT NULL DEFAULT 0 CHECK (sign_in_count >= 0),
    -- Keycloak session id (token claim "sid") of the last counted sign-in, so each sign-in is counted once however
    -- many pages the guest opens.
    ADD COLUMN last_session_id    VARCHAR(64);
