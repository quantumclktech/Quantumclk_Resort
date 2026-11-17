#!/bin/bash
# Runs once, on the first start of an empty volume.
# One database plus one least-privilege login per owner (Blueprint §6; ARCHITECTURE §4).
# guest_db added for guest-service (Gold Membership, D-120). Increment 2 adds lead_db the same way.
# An existing volume does not re-run this file: create new databases by hand (KEYCLOAK-SETUP / DAY-ONE).
set -euo pipefail
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
     -v kc_pw="$KC_DB_PASSWORD" -v access_pw="$ACCESS_DB_PASSWORD" -v guest_pw="$GUEST_DB_PASSWORD" -v lead_pw="$LEAD_DB_PASSWORD" <<'SQL'
CREATE ROLE keycloak   LOGIN PASSWORD :'kc_pw';
CREATE ROLE access_svc LOGIN PASSWORD :'access_pw';
CREATE ROLE guest_svc  LOGIN PASSWORD :'guest_pw';
CREATE ROLE lead_svc   LOGIN PASSWORD :'lead_pw';
CREATE DATABASE keycloak  OWNER keycloak;
CREATE DATABASE access_db OWNER access_svc;
CREATE DATABASE guest_db  OWNER guest_svc;
CREATE DATABASE lead_db   OWNER lead_svc;
REVOKE ALL ON DATABASE keycloak  FROM PUBLIC;
REVOKE ALL ON DATABASE access_db FROM PUBLIC;
REVOKE ALL ON DATABASE guest_db  FROM PUBLIC;
REVOKE ALL ON DATABASE lead_db   FROM PUBLIC;
SQL
