# api-gateway

- **Responsibility:** single API entry (Blueprint §12.1). Routes to the owning service, checks the staff JWT before routing (issuer, expiry ±60 s, `aud=erp-api`), rate-limits per employee or per IP (Redis), limits request size, adds and propagates `X-Correlation-Id`, and applies CORS for the two browser apps. **No business logic, no database.** Every service checks the token again.
- **Port (dev):** 8082. The unchanged landing page already calls this port.
- **Stack:** Spring Boot 4.1.2 + Spring Cloud 2025.1.4 (Gateway 5.0.4, WebFlux server) (D-115).

## Routes
| Path | To | Auth |
|---|---|---|
| `/api/v1/me`, `/api/v1/admin/**` | access-service (`ACCESS_SERVICE_URL`, default `http://localhost:8091`) | staff JWT |
| `/api/v1/portal/**` | (increment 2: guest-service / lead-service) | public, IP rate limit |
| `/actuator/health` | gateway itself | public |

## Build and test
```bash
cd ERP_DEV/services/api-gateway
./mvnw verify       # ✅ 10 tests; needs Docker (Testcontainers starts Redis 8.10.3)
```

## Run locally
```bash
set -a; . ../../.env; set +a        # REDIS_PASSWORD etc.
./mvnw spring-boot:run
curl -i localhost:8082/api/v1/me    # ✅ 401 + X-Correlation-Id
```
| Variable | Default |
|---|---|
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | `localhost` / `6379` / — (required) |
| `KEYCLOAK_URL` / `KEYCLOAK_REALM` | `http://localhost:8081` / `gh-staff` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` |
| `RATE_LIMIT_PER_SECOND` / `RATE_LIMIT_BURST` | `20` / `40` per caller |
| `MAX_REQUEST_SIZE` | `1MB` |

Known limits:
- If Redis is unreachable, Spring Cloud Gateway's rate limiter **lets requests through** (fail-open) and logs the error. That's acceptable for internal staff traffic; add a health alert in the ops increment (R-011).
- Rate limiting by IP uses the direct peer address. Behind a load balancer, trusted proxy headers must be configured at deploy time.
