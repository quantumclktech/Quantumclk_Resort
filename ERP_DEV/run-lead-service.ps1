$envFile = "$PSScriptRoot\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), "Process")
        }
    }
}
# Development checkout only: also load the sample leads (db/dev-seed). The production repo has no dev-seed folder,
# so there only the schema migrations run (D-142).
$devSeed = "$PSScriptRoot\services\lead-service\src\main\resources\db\dev-seed"
if (-not $env:LEAD_FLYWAY_LOCATIONS -and (Test-Path $devSeed)) {
    $env:LEAD_FLYWAY_LOCATIONS = "classpath:db/migration,classpath:db/dev-seed"
}
Set-Location "$PSScriptRoot\services\lead-service"
& .\mvnw.cmd spring-boot:run
