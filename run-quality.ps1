# ==============================================================
# run-quality.ps1 - Análisis de Calidad MERCAPLENO con SonarQube
# ==============================================================
# Uso: .\run-quality.ps1
# Opciones:
#   -SkipTests     : Omite las pruebas Jest (usa coverage existente)
#   -SkipSonar     : Solo ejecuta las pruebas, sin lanzar SonarQube
#   -WithDB        : Levanta también la base de datos (para pruebas de integración)
#   -SonarToken    : Token de autenticación de SonarQube (opcional)
# ==============================================================

param(
    [switch]$SkipTests,
    [switch]$SkipSonar,
    [switch]$WithDB,
    [string]$SonarToken = "",
    [string]$SonarPassword = "admin"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = $ScriptDir
$BackendDir = Join-Path $ProjectRoot "mercapleno-backend"
$DockerDir = Join-Path $ProjectRoot "mercapleno-docker"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  MERCAPLENO - Análisis de Calidad con SonarQube" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# --------------------------------------------------------------
# PASO 1: Iniciar SonarQube
# --------------------------------------------------------------
Write-Host "[1/4] Iniciando SonarQube..." -ForegroundColor Yellow

Push-Location $DockerDir

# Limpiar volúmenes anteriores si se quiere instalación fresca
# docker compose -f docker-compose.sonar.yml down -v --remove-orphans

docker compose -f docker-compose.sonar.yml up -d sonarqube sonar-db

if ($LASTEXITCODE -ne 0) {
    Write-Error "Error al iniciar SonarQube. Verifica que Docker Desktop esté corriendo."
    exit 1
}

# Si se pide con DB completa para pruebas de integración
if ($WithDB) {
    Write-Host "  Iniciando también MariaDB para pruebas de integración..." -ForegroundColor Gray
    docker compose -f docker-compose.yml up -d db
    Write-Host "  Esperando a que MariaDB esté lista (30s)..." -ForegroundColor Gray
    Start-Sleep -Seconds 30
}

Pop-Location

# Esperar a que SonarQube esté disponible
Write-Host "  Esperando a que SonarQube esté listo en http://localhost:9000..." -ForegroundColor Gray

$MaxWait = 120
$Elapsed = 0
$SonarReady = $false

do {
    Start-Sleep -Seconds 5
    $Elapsed += 5
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:9000/api/system/status" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
        $status = ($response.Content | ConvertFrom-Json).status
        if ($status -eq "UP") {
            $SonarReady = $true
            Write-Host "  ✅ SonarQube listo! (${Elapsed}s)" -ForegroundColor Green
        } else {
            Write-Host "  ... SonarQube estado: $status (${Elapsed}s)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ... Esperando SonarQube (${Elapsed}s)" -ForegroundColor Gray
    }
} while (-not $SonarReady -and $Elapsed -lt $MaxWait)

if (-not $SonarReady) {
    Write-Error "SonarQube no estuvo listo en ${MaxWait}s. Revisa los logs: docker logs mercapleno-sonarqube"
    exit 1
}

# --------------------------------------------------------------
# PASO 2: Ejecutar pruebas Jest con coverage
# --------------------------------------------------------------
if (-not $SkipTests) {
    Write-Host ""
    Write-Host "[2/4] Ejecutando pruebas Jest con coverage..." -ForegroundColor Yellow
    Push-Location $BackendDir

    npm run test:sonar
    $TestExitCode = $LASTEXITCODE

    Pop-Location

    if ($TestExitCode -ne 0) {
        Write-Host "  ⚠️  Algunas pruebas fallaron (código: $TestExitCode)" -ForegroundColor Yellow
        Write-Host "  Continuando con el análisis SonarQube de todas formas..." -ForegroundColor Gray
    } else {
        Write-Host "  ✅ Pruebas completadas exitosamente" -ForegroundColor Green
    }

    # Verificar que lcov.info existe
    $LcovPath = Join-Path $BackendDir "coverage\lcov.info"
    if (Test-Path $LcovPath) {
        $LcovSize = (Get-Item $LcovPath).Length
        Write-Host "  ✅ coverage/lcov.info generado ($LcovSize bytes)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  No se encontró coverage/lcov.info" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "[2/4] Omitiendo pruebas Jest (--SkipTests)" -ForegroundColor Gray
}

# --------------------------------------------------------------
# PASO 3: Lanzar SonarScanner via Docker
# --------------------------------------------------------------
if (-not $SkipSonar) {
    Write-Host ""
    Write-Host "[3/4] Lanzando SonarScanner..." -ForegroundColor Yellow

    # Autenticación: usar token si se proporcionó, sino user/password
    if ($SonarToken -ne "") {
        $SonarAuthParams = "-Dsonar.token=$SonarToken"
    } else {
        $SonarAuthParams = "-Dsonar.login=admin -Dsonar.password=$SonarPassword"
    }

    # Convertir ruta de Windows a formato Docker (para volumen mount)
    $ProjectRootDocker = $ProjectRoot -replace "\\", "/" -replace "^([A-Z]):", '/$1'

    Write-Host "  Montando proyecto desde: $ProjectRoot" -ForegroundColor Gray

    # Construir argumentos como array para evitar problemas con backtick en PowerShell
    $dockerArgs = @(
        "run", "--rm",
        "--network=host",
        "-v", "${ProjectRoot}:/usr/src",
        "sonarsource/sonar-scanner-cli:latest",
        "-Dsonar.host.url=http://localhost:9000",
        "-Dsonar.projectBaseDir=/usr/src"
    )

    # Agregar token solo si se pasó explícitamente;
    # si no, sonar-project.properties ya tiene sonar.token definido
    if ($SonarToken -ne "") {
        $dockerArgs += "-Dsonar.token=$SonarToken"
    }

    & docker @dockerArgs

    if ($LASTEXITCODE -ne 0) {
        Write-Error "SonarScanner falló. Revisa los logs arriba."
        exit 1
    }

    Write-Host "  ✅ Análisis SonarQube completado" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[3/4] Omitiendo SonarScanner (--SkipSonar)" -ForegroundColor Gray
}

# --------------------------------------------------------------
# PASO 4: Resultado
# --------------------------------------------------------------
Write-Host ""
Write-Host "[4/4] ¡Proceso completado!" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Dashboard SonarQube: http://localhost:9000" -ForegroundColor Cyan
Write-Host "  Usuario: admin  |  Contraseña: admin (cambiar en primer acceso)" -ForegroundColor Cyan
Write-Host "  Proyecto: mercapleno" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Abrir el navegador automáticamente
$OpenBrowser = Read-Host "¿Abrir SonarQube en el navegador ahora? (S/n)"
if ($OpenBrowser -ne "n" -and $OpenBrowser -ne "N") {
    Start-Process "http://localhost:9000/dashboard?id=mercapleno"
}
