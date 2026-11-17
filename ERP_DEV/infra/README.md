# infra — local development infrastructure

Built in increment 1, slice S1 (2026-11-15).

| File | What |
|---|---|
| `docker-compose.yml` | PostgreSQL 18.7, Keycloak 26.8.2 (`start-dev --import-realm`), Redis 8.10.3, Mailpit 1.33.1, Caddy 2.11.7 (`proxy`: one public origin split by path, `proxy/Caddyfile`, D-124). Ports bind to 127.0.0.1; PostgreSQL is published on **5433** |
| `keycloak/gh-staff-realm.json` | Staff realm import, generated from `docs/02-architecture/identity/KEYCLOAK-SETUP.md`. Secrets and SMTP values are `${ENV}` placeholders only. CI job `realm-check` guards its security settings |
| `postgres/init/01-service-databases.sh` | First-start script: databases `keycloak` and `access_db`, each with its own login (`keycloak`, `access_svc`). Increment 2 adds `guest_db` and `lead_db` the same way |

Run (from the repo root), after putting the variables from `ERP_DEV/.env.example` into your `ERP_DEV/.env`:

```bash
docker compose --env-file ERP_DEV/.env -f ERP_DEV/infra/docker-compose.yml up -d --wait
docker compose --env-file ERP_DEV/.env -f ERP_DEV/infra/docker-compose.yml down        # stop (keeps data)
```

The realm is imported only when it doesn't exist yet. After changing `gh-staff-realm.json` in dev, reset with `down -v` (**deletes the local dev database volume**).
