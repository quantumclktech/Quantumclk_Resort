-- Gold Member registration: ID proof, 18+ guard, structured address (SOW ERP-05 member registration; D-131…D-134).
--
-- ID proof is Aadhaar or a driving licence (client, Discovery Call 2026-10-28 [22:56]). The full number is NEVER
-- stored: only a masked form for people (Aadhaar XXXX-XXXX-0123, licence XXXXXXXXXXX1234) and a keyed hash
-- (HMAC-SHA256, key MEMBERSHIP_ID_HASH_KEY) so one ID can't hold two live memberships. A plain SHA-256 would not
-- do: there are only ~10^12 Aadhaar numbers, so an unkeyed hash can be reversed by trying them all.
--
-- Rows registered before this change keep registration_form = 1 and have none of these fields (members are never
-- deleted); every new registration is form 2 and must have all of them and be 18+ on the day it was registered.

ALTER TABLE resort_member
    ADD COLUMN registration_form SMALLINT     NOT NULL DEFAULT 1 CHECK (registration_form IN (1, 2)),
    ADD COLUMN id_type           VARCHAR(20)  CHECK (id_type IN ('AADHAAR', 'DRIVING_LICENCE')),
    ADD COLUMN id_number_masked  VARCHAR(20),
    ADD COLUMN id_number_hash    CHAR(64)     CHECK (id_number_hash ~ '^[0-9a-f]{64}$'),
    ADD COLUMN pincode           VARCHAR(6)   CHECK (pincode ~ '^[1-9][0-9]{5}$'),
    ADD COLUMN city              VARCHAR(100),
    ADD COLUMN state             VARCHAR(100),
    ADD COLUMN country           VARCHAR(100);

COMMENT ON COLUMN resort_member.address IS 'Street address (house, street, area); city, state, pincode and country are separate since V3';

ALTER TABLE resort_member ADD CONSTRAINT resort_member_form2_complete CHECK (
    registration_form = 1 OR (
        id_type IS NOT NULL AND id_number_masked IS NOT NULL AND id_number_hash IS NOT NULL
        AND pincode IS NOT NULL AND city IS NOT NULL AND state IS NOT NULL AND country IS NOT NULL
        -- 18 or older on the registration date, in resort time (IST). Uses created_at, not CURRENT_DATE, so the rule
        -- never changes with the clock and a restore re-checks the same way.
        AND dob <= ((created_at AT TIME ZONE 'Asia/Kolkata')::date - INTERVAL '18 years')::date));

-- One live membership per ID document; a REJECTED registration does not block a new one (same rule as email/mobile).
CREATE UNIQUE INDEX resort_member_id_live ON resort_member (id_number_hash) WHERE status <> 'REJECTED';
