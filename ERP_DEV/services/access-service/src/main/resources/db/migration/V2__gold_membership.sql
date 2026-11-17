-- Gold Membership (SOW ERP-05; docs/03-phases/phase-1/inc-membership-PLAN.md S1; D-116…D-118).
-- Members are never deleted (no ON DELETE CASCADE): a rejected registration stays as history.
-- Every change is written to the append-only audit_event table (entity_type 'MEMBER').

-- Client numbering series (LM Mem ID.xlsx / Loyalty_Voucher_Numbers_5000.xlsx: GRH-LM-0101 … GRH-LM-5100).
-- One row per series. The number is taken with UPDATE … RETURNING inside the registration transaction, so it is
-- gap-free: a failed registration rolls the counter back too (D-117).
CREATE TABLE membership_number_counter (
    series       VARCHAR(20) PRIMARY KEY,
    next_number  INT NOT NULL CHECK (next_number >= 1),
    last_number  INT NOT NULL CHECK (last_number >= 1)
);
INSERT INTO membership_number_counter (series, next_number, last_number) VALUES ('GRH-LM', 101, 5100);

CREATE TABLE resort_member (
    id                    UUID PRIMARY KEY,
    membership_id         VARCHAR(32)  NOT NULL UNIQUE CHECK (membership_id ~ '^GRH-LM-[0-9]{4}$'),
    first_name            VARCHAR(100) NOT NULL,
    last_name             VARCHAR(100) NOT NULL,
    dob                   DATE         NOT NULL CHECK (dob > DATE '1900-01-01'),
    mobile_e164           VARCHAR(16)  NOT NULL CHECK (mobile_e164 ~ '^\+[1-9][0-9]{7,14}$'),
    email                 VARCHAR(254) NOT NULL CHECK (email = lower(email)),
    address               VARCHAR(500) NOT NULL,
    tier                  VARCHAR(20)  NOT NULL DEFAULT 'GOLD' CHECK (tier IN ('GOLD')),
    status                VARCHAR(30)  NOT NULL CHECK (status IN ('PENDING_VERIFICATION', 'ACTIVE', 'REJECTED')),
    enrolled_by_id        UUID         NOT NULL REFERENCES employee (id),
    enrolled_by_name      VARCHAR(201) NOT NULL,   -- snapshot: the name the customer was told at the time
    enrolled_by_username  VARCHAR(50)  NOT NULL,
    decided_by_id         UUID         REFERENCES employee (id),   -- who verified or rejected
    decided_at            TIMESTAMPTZ,
    valid_from            TIMESTAMPTZ,
    valid_until           TIMESTAMPTZ,
    -- Keycloak gh-guests user id, set when the customer account is provisioned (S3, D-120).
    guest_user_id         UUID         UNIQUE,
    account_status        VARCHAR(30)  NOT NULL DEFAULT 'NOT_PROVISIONED'
                          CHECK (account_status IN ('NOT_PROVISIONED', 'INVITE_SENT', 'INVITE_FAILED', 'ACTIVE')),
    created_at            TIMESTAMPTZ  NOT NULL,
    updated_at            TIMESTAMPTZ  NOT NULL,
    version               INT          NOT NULL DEFAULT 0,
    CONSTRAINT resort_member_validity CHECK (
        (status = 'ACTIVE') = (valid_from IS NOT NULL AND valid_until IS NOT NULL AND valid_until > valid_from)),
    CONSTRAINT resort_member_decided CHECK ((status = 'PENDING_VERIFICATION') = (decided_at IS NULL))
);
-- One live membership per email / mobile; a REJECTED registration does not block a new one.
CREATE UNIQUE INDEX resort_member_email_live  ON resort_member (email)       WHERE status <> 'REJECTED';
CREATE UNIQUE INDEX resort_member_mobile_live ON resort_member (mobile_e164) WHERE status <> 'REJECTED';
CREATE INDEX resort_member_status   ON resort_member (status, created_at);
CREATE INDEX resort_member_enrolled ON resort_member (enrolled_by_id, created_at);

CREATE TABLE member_payment (
    id                   UUID PRIMARY KEY,
    member_id            UUID          NOT NULL REFERENCES resort_member (id),
    payment_type         VARCHAR(20)   NOT NULL CHECK (payment_type IN ('CASH', 'CARD', 'SCAN_QR')),
    amount               NUMERIC(12,2) NOT NULL CHECK (amount > 0),   -- rupees, fixed point (rules §1); no float
    currency             CHAR(3)       NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
    transaction_id       VARCHAR(100),                                -- card reference or UPI UTR
    -- Proof screenshot: stored AES-256-GCM encrypted under an opaque key (rules §11); the original name is display only.
    proof_file_key       VARCHAR(64),
    proof_file_name      VARCHAR(255),
    proof_content_type   VARCHAR(50),
    proof_size_bytes     BIGINT,
    proof_sha256         CHAR(64),                                    -- of the original bytes
    status               VARCHAR(20)   NOT NULL CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    rejection_reason     TEXT,
    decided_by_id        UUID          REFERENCES employee (id),
    decided_by_username  VARCHAR(50),
    decided_at           TIMESTAMPTZ,
    created_at           TIMESTAMPTZ   NOT NULL,
    CONSTRAINT member_payment_card_ref  CHECK (payment_type <> 'CARD'    OR transaction_id IS NOT NULL),
    CONSTRAINT member_payment_qr_proof  CHECK (payment_type <> 'SCAN_QR' OR proof_file_key IS NOT NULL),
    CONSTRAINT member_payment_proof_all CHECK ((proof_file_key IS NULL) = (proof_sha256 IS NULL)),
    CONSTRAINT member_payment_rejected  CHECK ((status = 'REJECTED') = (rejection_reason IS NOT NULL))
);
CREATE INDEX member_payment_member ON member_payment (member_id);
