-- access_db baseline (docs/02-architecture/identity/AUTHENTICATION.md §9).
-- No passwords, OTPs or tokens are ever stored here (ADR-002).

CREATE TABLE employee (
    id                UUID PRIMARY KEY,
    keycloak_user_id  UUID UNIQUE,
    first_name        VARCHAR(100) NOT NULL,
    last_name         VARCHAR(100) NOT NULL,
    email             VARCHAR(254) NOT NULL UNIQUE CHECK (email = lower(email)),
    username          VARCHAR(50)  NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9._-]{3,50}$'),
    mobile_e164       VARCHAR(16)  NOT NULL UNIQUE CHECK (mobile_e164 ~ '^\+[1-9][0-9]{7,14}$'),
    job_role          VARCHAR(30)  NOT NULL CHECK (job_role IN ('ADMIN', 'MANAGER', 'SALES_EXECUTIVE')),
    whatsapp_opt_in   BOOLEAN      NOT NULL DEFAULT false,
    status            VARCHAR(30)  NOT NULL CHECK (status IN ('PENDING_PROVISIONING', 'INVITED', 'INVITE_EMAIL_FAILED', 'ACTIVE', 'DISABLED')),
    status_reason     TEXT,
    created_by        UUID         NOT NULL,
    updated_by        UUID         NOT NULL,
    created_at        TIMESTAMPTZ  NOT NULL,
    updated_at        TIMESTAMPTZ  NOT NULL,
    version           INT          NOT NULL DEFAULT 0
);

CREATE TABLE audit_event (
    id              UUID PRIMARY KEY,
    occurred_at     TIMESTAMPTZ  NOT NULL,
    actor_id        UUID,                      -- null only for SYSTEM_BOOTSTRAP / jobs
    actor_label     VARCHAR(50)  NOT NULL,     -- employee username or SYSTEM_* name
    actor_ip        VARCHAR(45),
    action          VARCHAR(50)  NOT NULL,
    entity_type     VARCHAR(30)  NOT NULL,
    entity_id       UUID,
    before_json     JSONB,
    after_json      JSONB,
    reason          TEXT,
    correlation_id  VARCHAR(64),
    outcome         VARCHAR(20)  NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILURE'))
);
CREATE INDEX audit_event_entity ON audit_event (entity_type, entity_id, occurred_at);
CREATE INDEX audit_event_actor  ON audit_event (actor_id, occurred_at);

-- Append-only: the app's DB user owns this table, so enforce it with a trigger, not just grants.
CREATE FUNCTION audit_event_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'audit_event is append-only';
END $$;
CREATE TRIGGER audit_event_no_update_delete BEFORE UPDATE OR DELETE ON audit_event
    FOR EACH ROW EXECUTE FUNCTION audit_event_append_only();
CREATE TRIGGER audit_event_no_truncate BEFORE TRUNCATE ON audit_event
    FOR EACH STATEMENT EXECUTE FUNCTION audit_event_append_only();

CREATE TABLE idempotency_key (
    key            UUID         NOT NULL,
    actor_id       UUID         NOT NULL,
    request_hash   VARCHAR(64)  NOT NULL,
    response_json  JSONB,
    created_at     TIMESTAMPTZ  NOT NULL,
    PRIMARY KEY (actor_id, key)
);
CREATE INDEX idempotency_key_created ON idempotency_key (created_at);   -- 24 h clean-up job
