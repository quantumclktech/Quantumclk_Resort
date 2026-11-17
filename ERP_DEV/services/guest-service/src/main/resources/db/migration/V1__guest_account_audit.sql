-- guest_db baseline (guest-service; D-119…D-122). No passwords, OTPs, tokens or membership data are stored here:
-- Keycloak gh-guests holds credentials and sessions, access-service holds memberships (D-120).

CREATE TABLE guest_account (
    keycloak_user_id  UUID PRIMARY KEY,
    email             VARCHAR(254) NOT NULL UNIQUE CHECK (email = lower(email)),
    first_name        VARCHAR(100) NOT NULL,
    last_name         VARCHAR(100) NOT NULL,
    mobile_e164       VARCHAR(16)  CHECK (mobile_e164 ~ '^\+[1-9][0-9]{7,14}$'),
    source            VARCHAR(20)  NOT NULL CHECK (source IN ('MEMBERSHIP', 'SELF_REGISTERED')),
    welcome_sent_at   TIMESTAMPTZ,
    welcome_count     INT          NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ  NOT NULL,
    updated_at        TIMESTAMPTZ  NOT NULL
);

CREATE TABLE audit_event (
    id              UUID PRIMARY KEY,
    occurred_at     TIMESTAMPTZ  NOT NULL,
    actor_label     VARCHAR(100) NOT NULL,     -- calling client (e.g. access-service) and, when given, the employee
    action          VARCHAR(50)  NOT NULL,
    entity_id       UUID,
    details_json    JSONB,
    reason          TEXT,
    correlation_id  VARCHAR(64),
    outcome         VARCHAR(20)  NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILURE'))
);
CREATE INDEX audit_event_entity ON audit_event (entity_id, occurred_at);

-- Append-only, enforced in the database (same rule as access_db).
CREATE FUNCTION audit_event_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'audit_event is append-only';
END $$;
CREATE TRIGGER audit_event_no_update_delete BEFORE UPDATE OR DELETE ON audit_event
    FOR EACH ROW EXECUTE FUNCTION audit_event_append_only();
CREATE TRIGGER audit_event_no_truncate BEFORE TRUNCATE ON audit_event
    FOR EACH STATEMENT EXECUTE FUNCTION audit_event_append_only();
