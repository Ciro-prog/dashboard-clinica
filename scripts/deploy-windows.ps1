# Dashboard Clínica - Script de Despliegue para Windows
# Uso: .\scripts\deploy-windows.ps1 [-Mode setup|update|full]

param(
    [ValidateSet("setup", "update", "full")]
    [string]$Mode = "update"
)

# Configuración de colores
$Host.UI.RawUI.ForegroundColor = "White"

function Write-Banner {
    Write-Host @"
╔═══════════════════════════════════════════════╗
║      🏥 DASHBOARD CLÍNICA - WINDOWS          ║
║           Despliegue Automático              ║
╚═══════════════════════════════════════════════╝
"@ -ForegroundColor Green
}

function Write-Log {
    param([string]$Message)
    Write-Host "[DEPLOY] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Magenta
}

# Variables de configuración
$ProjectDir = "C:\Projects\dashboard-clinica"
$BackupDir = "C:\Backups\dashboard-clinica"
$LogFile = "C:\Logs\dashboard-clinica-deploy.log"
$GitHubRepo = "https://github.com/Ciro-prog/dashboard-clinica.git"

Write-Banner
Write-Log "Iniciando despliegue en modo: $Mode"

# Función para verificar dependencias
function Test-Dependencies {
    Write-Step "Verificando Dependencias"
    
    # Verificar Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker no está instalado o no está en PATH"
        Write-Info "Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop"
        return $false
    }
    
    # Verificar Docker Compose
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue) -and 
        -not (docker compose version 2>$null)) {
        Write-Error "Docker Compose no está disponible"
        return $false
    }
    
    # Verificar Git
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Error "Git no está instalado"
        Write-Info "Instala Git desde: https://git-scm.com/"
        return $false
    }
    
    # Verificar Docker Desktop está corriendo
    try {
        docker version | Out-Null
        Write-Log "✅ Docker Desktop está funcionando"
    }
    catch {
        Write-Error "Docker Desktop no está ejecutándose"
        Write-Info "Por favor inicia Docker Desktop y vuelve a intentar"
        return $false
    }
    
    Write-Log "✅ Todas las dependencias están disponibles"
    return $true
}

# Función para configuración inicial
function Initialize-WindowsSetup {
    Write-Step "Configuración Inicial Windows"
    
    # Crear directorios necesarios
    if (-not (Test-Path $ProjectDir)) {
        New-Item -ItemType Directory -Path $ProjectDir -Force | Out-Null
        Write-Log "Directorio de proyecto creado: $ProjectDir"
    }
    
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
        Write-Log "Directorio de backup creado: $BackupDir"
    }
    
    if (-not (Test-Path (Split-Path $LogFile))) {
        New-Item -ItemType Directory -Path (Split-Path $LogFile) -Force | Out-Null
    }
    
    # Configurar política de ejecución si es necesario
    $executionPolicy = Get-ExecutionPolicy -Scope CurrentUser
    if ($executionPolicy -eq "Restricted") {
        Write-Warning "Configurando política de ejecución de scripts..."
        Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Write-Log "✅ Política de ejecución configurada"
    }
    
    # Verificar Windows Defender Firewall (opcional)
    Write-Info "Recuerda configurar Windows Defender Firewall para los puertos:"
    Write-Info "  - 60521 (Frontend Cliente)"
    Write-Info "  - 60522 (Backend API)"
    Write-Info "  - 60523 (Admin Frontend)"
    Write-Info "  - 60516 (MongoDB)"
    
    Write-Log "✅ Configuración inicial completada"
}

# Función para gestionar repositorio
function Manage-Repository {
    Write-Step "Gestión del Repositorio"
    
    if (-not (Test-Path "$ProjectDir\.git")) {
        Write-Log "Clonando repositorio..."
        
        # Si el directorio existe pero no es un repo git
        if ((Test-Path $ProjectDir) -and ((Get-ChildItem $ProjectDir).Count -gt 0)) {
            $backupName = "${ProjectDir}_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
            Write-Warning "Directorio no vacío, creando backup..."
            Move-Item $ProjectDir $backupName
            New-Item -ItemType Directory -Path $ProjectDir -Force | Out-Null
        }
        
        # Clonar repositorio
        Set-Location (Split-Path $ProjectDir)
        git clone $GitHubRepo $ProjectDir
        
        if (-not $?) {
            Write-Error "Error clonando repositorio"
            return $false
        }
    }
    else {
        Write-Log "Actualizando repositorio existente..."
        Set-Location $ProjectDir
        
        # Verificar estado del repositorio
        $gitStatus = git status --porcelain
        if ($gitStatus) {
            Write-Warning "Cambios locales detectados, creando stash..."
            git stash push -m "Auto-stash antes de despliegue $(Get-Date)"
        }
        
        # Actualizar desde origin
        git fetch origin
        git reset --hard origin/main
        git clean -fd
    }
    
    Set-Location $ProjectDir
    Write-Log "✅ Repositorio actualizado"
    return $true
}

# Función para crear backup
function New-Backup {
    Write-Step "Creando Backup"
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupPath = "$BackupDir\backup_$timestamp"
    
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    
    # Backup de configuración
    if (Test-Path "$ProjectDir\.env") {
        Copy-Item "$ProjectDir\.env" "$backupPath\" -Force
        Write-Log "✅ Configuración .env respaldada"
    }
    
    # Backup de base de datos (si MongoDB está corriendo)
    $mongoContainer = docker ps --filter "expose=60516" --format "{{.Names}}" 2>$null
    if ($mongoContainer) {
        Write-Log "Creando backup de MongoDB..."
        try {
            docker exec $mongoContainer mongodump --out /tmp/backup_$timestamp 2>$null
            docker cp "${mongoContainer}:/tmp/backup_$timestamp" "$backupPath\mongodb\" 2>$null
            Write-Log "✅ Base de datos respaldada"
        }
        catch {
            Write-Warning "No se pudo crear backup de MongoDB"
        }
    }
    
    # Backup de logs si existen
    if (Test-Path "$ProjectDir\logs") {
        Copy-Item "$ProjectDir\logs" "$backupPath\" -Recurse -Force
    }
    
    Write-Log "✅ Backup creado en: $backupPath"
}

# Función para configurar variables de entorno
function Set-Environment {
    Write-Step "Configurando Variables de Entorno"
    
    Set-Location $ProjectDir
    
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Write-Log "Creando .env desde plantilla..."
            Copy-Item ".env.example" ".env"
        }
        else {
            Write-Error "No se encontró .env.example"
            return $false
        }
    }
    
    # Configurar para desarrollo local Windows
    $envContent = Get-Content ".env" -Raw
    
    # Reemplazar URLs de localhost si es necesario
    if ($envContent -match "TU-SERVIDOR-IP") {
        Write-Log "Configurando URLs para desarrollo local..."
        $envContent = $envContent -replace "TU-SERVIDOR-IP", "localhost"
        $envContent | Set-Content ".env" -NoNewline
    }
    
    # Verificar configuración crítica
    if ($envContent -match "your-secret-key-here|your-api-key-here|CAMBIAR-POR-") {
        Write-Warning "⚠️  IMPORTANTE: Configura las claves secretas en .env"
        Write-Warning "⚠️  Usa claves seguras para ADMIN_SECRET_KEY y API_SECRET_KEY"
    }
    
    Write-Log "✅ Variables de entorno configuradas"
    return $true
}

# Función para verificar MongoDB
function Test-MongoDB {
    Write-Step "Verificando MongoDB"
    
    $mongoContainer = docker ps --filter "publish=60516" --format "{{.Names}}" 2>$null
    if ($mongoContainer) {
        Write-Log "✅ MongoDB encontrado en puerto 60516"
    }
    else {
        Write-Warning "MongoDB no encontrado en puerto 60516"
        $response = Read-Host "¿Deseas crear un contenedor MongoDB? (y/N)"
        if ($response -eq "y" -or $response -eq "Y") {
            Write-Log "Creando contenedor MongoDB..."
            docker run -d `
                --name mongodb-clinic `
                -p 60516:27017 `
                -v mongodb_clinic_data:/data/db `
                --restart unless-stopped `
                mongo:7.0
            
            Start-Sleep -Seconds 5
            Write-Log "✅ MongoDB creado y ejecutándose"
        }
    }
}

# Función para hacer deploy de la aplicación
function Deploy-Application {
    Write-Step "Desplegando Aplicación"
    
    Set-Location $ProjectDir
    
    # Detener servicios existentes
    if (Test-Path "docker-compose.yml") {
        Write-Log "Deteniendo servicios existentes..."
        docker-compose down --remove-orphans 2>$null
    }
    
    # Limpiar imágenes viejas en modo full
    if ($Mode -eq "full") {
        Write-Log "Limpiando imágenes Docker viejas..."
        docker system prune -a -f 2>$null
    }
    
    # Construir imágenes
    Write-Log "Construyendo imágenes Docker..."
    if ($Mode -eq "setup") {
        docker-compose build --parallel
    }
    else {
        docker-compose build
    }
    
    if (-not $?) {
        Write-Error "Error construyendo imágenes"
        return $false
    }
    
    # Iniciar servicios en modo development para Windows
    Write-Log "Iniciando servicios en modo desarrollo..."
    docker-compose --profile development up -d
    
    if (-not $?) {
        Write-Error "Error iniciando servicios"
        return $false
    }
    
    # Esperar a que los servicios estén listos
    Write-Log "Esperando que los servicios estén listos..."
    Start-Sleep -Seconds 15
    
    # Verificar que los servicios estén funcionando
    $containers = docker-compose ps --services --filter "status=running"
    if ($containers) {
        Write-Log "✅ Servicios iniciados correctamente"
    }
    else {
        Write-Error "❌ Algunos servicios no iniciaron correctamente"
        docker-compose ps
        return $false
    }
    
    return $true
}

# Función para verificación final
function Test-Deployment {
    Write-Step "Verificación Final"
    
    Set-Location $ProjectDir
    
    # Verificar contenedores
    Write-Log "Estado de contenedores:"
    docker-compose ps
    
    # Verificar conectividad
    Write-Log "Verificando conectividad de servicios..."
    
    $services = @(
        @{Name="Backend API"; URL="http://localhost:60522/health"},
        @{Name="Frontend Cliente"; URL="http://localhost:60521"},
        @{Name="Admin Frontend"; URL="http://localhost:60523"}
    )
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri $service.URL -TimeoutSec 10 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Log "✅ $($service.Name) respondiendo"
            }
        }
        catch {
            Write-Warning "❌ $($service.Name) no responde"
        }
    }
    
    # Mostrar URLs de acceso
    Write-Host "`n🎉 ¡Despliegue completado exitosamente!" -ForegroundColor Green
    Write-Host "📱 URLs de acceso:" -ForegroundColor Blue
    Write-Host "  Frontend Cliente:   http://localhost:60521" -ForegroundColor Cyan
    Write-Host "  Backend API:        http://localhost:60522" -ForegroundColor Cyan
    Write-Host "  Admin Frontend:     http://localhost:60523" -ForegroundColor Cyan
    Write-Host "  API Docs:           http://localhost:60522/docs" -ForegroundColor Cyan
    
    Write-Host "`n📝 Comandos útiles:" -ForegroundColor Yellow
    Write-Host "  Ver logs:           docker-compose logs -f"
    Write-Host "  Detener servicios:  docker-compose down"
    Write-Host "  Estado:             docker-compose ps"
    Write-Host "  Actualizar:         .\scripts\deploy-windows.ps1 -Mode update"
}

# Función principal
function Main {
    try {
        # Logging de inicio
        "$(Get-Date): Iniciando despliegue modo $Mode" | Out-File $LogFile -Append
        
        switch ($Mode) {
            "setup" {
                if (-not (Test-Dependencies)) { exit 1 }
                Initialize-WindowsSetup
                if (-not (Manage-Repository)) { exit 1 }
                if (-not (Set-Environment)) { exit 1 }
                Test-MongoDB
                if (-not (Deploy-Application)) { exit 1 }
                Test-Deployment
            }
            "update" {
                if (-not (Test-Dependencies)) { exit 1 }
                New-Backup
                if (-not (Manage-Repository)) { exit 1 }
                if (-not (Set-Environment)) { exit 1 }
                if (-not (Deploy-Application)) { exit 1 }
                Test-Deployment
            }
            "full" {
                if (-not (Test-Dependencies)) { exit 1 }
                New-Backup
                if (-not (Manage-Repository)) { exit 1 }
                if (-not (Set-Environment)) { exit 1 }
                Test-MongoDB
                if (-not (Deploy-Application)) { exit 1 }
                Test-Deployment
            }
        }
        
        Write-Log "🏥 ¡Dashboard Clínica desplegado exitosamente!"
        "$(Get-Date): Despliegue completado exitosamente" | Out-File $LogFile -Append
    }
    catch {
        Write-Error "Despliegue falló: $($_.Exception.Message)"
        "$(Get-Date): Despliegue falló - $($_.Exception.Message)" | Out-File $LogFile -Append
        exit 1
    }
}

# Ejecutar función principal
Main