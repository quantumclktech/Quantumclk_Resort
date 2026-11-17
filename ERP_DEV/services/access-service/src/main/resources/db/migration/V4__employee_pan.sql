-- Employee PAN (D-139). Same rule as member ID proofs (D-131): the full PAN is never stored, only a masked form for
-- people (XXXXXX234F) and a keyed HMAC-SHA256 that lets the database refuse a second employee with the same PAN.
-- Nullable: employees created before V4 and the bootstrap ADMIN have none; the API requires it for new employees.
ALTER TABLE employee
    ADD COLUMN pan_masked VARCHAR(10) CHECK (pan_masked ~ '^X{6}[0-9]{3}[A-Z]$'),
    ADD COLUMN pan_hash   VARCHAR(64) CHECK (pan_hash ~ '^[0-9a-f]{64}$'),
    ADD CONSTRAINT employee_pan_both CHECK ((pan_masked IS NULL) = (pan_hash IS NULL));

CREATE UNIQUE INDEX employee_pan_hash_key ON employee (pan_hash);
