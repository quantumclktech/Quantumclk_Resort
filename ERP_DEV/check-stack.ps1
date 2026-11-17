# Read-only check of the local dev stack before a phone test (D-124 layout). Changes nothing; prints OK/DOWN per part.
# Usage (PowerShell, from anywhere):  & "D:\Intership wrok\ERP_Resort\ERP_DEV\check-stack.ps1"
# Then start the tunnel on IPv4 explicitly:  ngrok http 127.0.0.1:8088 --url=<your domain>
$ErrorActionPreference = "SilentlyContinue"
$allOk = $true

function Report($name, $ok, $hint) {
    if ($ok) { Write-Host ("OK    " + $name) -ForegroundColor Green }
    else { Write-Host ("DOWN  " + $name + "  -> " + $hint) -ForegroundColor Red; $script:allOk = $false }
}

function Port($port) {
    $c = New-Object System.Net.Sockets.TcpClient
    try { $c.Connect("127.0.0.1", $port); return $c.Connected } catch { return $false } finally { $c.Close() }
}

function Http($url) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -MaximumRedirection 0
        return [int]$r.StatusCode
    } catch {
        if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
        return 0
    }
}

docker info *> $null
Report "Docker Desktop" ($LASTEXITCODE -eq 0) "start Docker Desktop, then: cd ERP_DEV\infra; docker compose up -d"
Report "Postgres :5433" (Port 5433) "docker compose up -d (ERP_DEV\infra)"
Report "Keycloak :8081 (gh-guests)" ((Http "http://127.0.0.1:8081/realms/gh-guests") -eq 200) "docker compose up -d; wait for Keycloak to be healthy"
Report "access-service :8091" (Port 8091) "ERP_DEV\run-access-service.ps1"
Report "api-gateway :8082" (Port 8082) "ERP_DEV\run-api-gateway.ps1"
Report "guest-service :8092" (Port 8092) "ERP_DEV\run-guest-service.ps1"
Report "lead-service :8093" (Port 8093) "ERP_DEV\run-lead-service.ps1"
Report "landing page :3000" (Port 3000) "run-landing-page.ps1"
Report "staff ERP :5173" (Port 5173) "cd ERP_DEV\web; npm run dev"

# The one public origin, as ngrok sees it (Caddy on 127.0.0.1:8088).
Report "proxy /            -> landing" ((Http "http://127.0.0.1:8088/") -eq 200) "Caddy (docker compose) and the landing page"
Report "proxy /erp/        -> staff ERP" ((Http "http://127.0.0.1:8088/erp/") -eq 200) "Caddy and Vite :5173"
Report "proxy /realms/...  -> Keycloak" ((Http "http://127.0.0.1:8088/realms/gh-guests/.well-known/openid-configuration") -eq 200) "Caddy and Keycloak"
Report "proxy /api/...     -> gateway" ((Http "http://127.0.0.1:8088/api/v1/portal/me") -eq 401) "Caddy, gateway and guest-service (401 = reachable, no token)"

if ($allOk) { Write-Host "`nAll parts up. Tunnel: ngrok http 127.0.0.1:8088 --url=<your domain>" -ForegroundColor Green }
else { Write-Host "`nFix the DOWN parts above before testing on the phone." -ForegroundColor Yellow }
