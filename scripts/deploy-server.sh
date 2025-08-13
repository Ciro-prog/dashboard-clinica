#!/bin/bash

# Script de despliegue automático para Dashboard Clínica en servidor Linux
# Uso: ./scripts/deploy-server.sh [--setup|--update|--full]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Banner
echo -e "${GREEN}"
cat << 'EOF'
╔═══════════════════════════════════════════════╗
║      🚀 DESPLIEGUE DASHBOARD CLÍNICA          ║
║           Servidor Linux Automático          ║
╚═══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Función para logging con colores
log() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

step() {
    echo -e "\n${PURPLE}=== $1 ===${NC}"
}

# Variables de configuración
PROJECT_DIR="/opt/dashboard-clinica"
BACKUP_DIR="/opt/backups/dashboard-clinica"
LOG_FILE="/var/log/dashboard-clinica-deploy.log"
GITHUB_REPO="git@github.com:TU_USUARIO/dashboard-clinica.git"

# Detectar modo de operación
MODE=${1:-update}

# Verificar argumentos
if [[ "$MODE" != "setup" && "$MODE" != "update" && "$MODE" != "full" ]]; then
    error "Modo inválido: $MODE"
    error "Usa: $0 [setup|update|full]"
    echo -e "\n${BLUE}Modos disponibles:${NC}"
    echo "  setup  - Configuración inicial completa del servidor"
    echo "  update - Actualización desde GitHub (por defecto)"
    echo "  full   - Reinstalación completa con backup"
    exit 1
fi

log "Iniciando despliegue en modo: $MODE"

# Función para verificar dependencias
check_dependencies() {
    step "Verificando Dependencias"
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        error "Docker no está instalado"
        return 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose no está disponible"
        return 1
    fi
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        error "Git no está instalado"
        return 1
    fi
    
    log "✅ Todas las dependencias están disponibles"
}

# Función para configuración inicial del servidor
setup_server() {
    step "Configuración Inicial del Servidor"
    
    # Actualizar sistema
    log "Actualizando sistema..."
    if command -v apt &> /dev/null; then
        sudo apt update && sudo apt upgrade -y
        sudo apt install -y curl wget git nano htop
    elif command -v yum &> /dev/null; then
        sudo yum update -y
        sudo yum install -y curl wget git nano htop
    fi
    
    # Instalar Docker si no existe
    if ! command -v docker &> /dev/null; then
        log "Instalando Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
    fi
    
    # Instalar Docker Compose si no existe
    if ! command -v docker-compose &> /dev/null; then
        log "Instalando Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    # Configurar firewall
    log "Configurando firewall..."
    if command -v ufw &> /dev/null; then
        sudo ufw --force enable
        sudo ufw allow ssh
        sudo ufw allow 60521
        sudo ufw allow 60522
        sudo ufw allow 60523
        sudo ufw allow 60516
    elif command -v firewall-cmd &> /dev/null; then
        sudo systemctl start firewalld
        sudo systemctl enable firewalld
        sudo firewall-cmd --permanent --add-port=22/tcp
        sudo firewall-cmd --permanent --add-port=60521/tcp
        sudo firewall-cmd --permanent --add-port=60522/tcp
        sudo firewall-cmd --permanent --add-port=60523/tcp
        sudo firewall-cmd --permanent --add-port=60516/tcp
        sudo firewall-cmd --reload
    fi
    
    # Crear directorios
    log "Creando estructura de directorios..."
    sudo mkdir -p $PROJECT_DIR
    sudo mkdir -p $BACKUP_DIR
    sudo chown $USER:$USER $PROJECT_DIR
    sudo chown $USER:$USER $BACKUP_DIR
    
    log "✅ Configuración inicial completada"
}

# Función para clonar/actualizar repositorio
manage_repository() {
    step "Gestión del Repositorio"
    
    if [ ! -d "$PROJECT_DIR/.git" ]; then
        log "Clonando repositorio..."
        
        # Si el directorio existe pero no es un repo git
        if [ -d "$PROJECT_DIR" ] && [ "$(ls -A $PROJECT_DIR)" ]; then
            warning "Directorio no vacío, creando backup..."
            sudo mv $PROJECT_DIR ${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)
            sudo mkdir -p $PROJECT_DIR
            sudo chown $USER:$USER $PROJECT_DIR
        fi
        
        # Intentar clonar con SSH primero, luego HTTPS
        if ! git clone $GITHUB_REPO $PROJECT_DIR; then
            warning "Clonado SSH falló, intentando HTTPS..."
            HTTPS_REPO=$(echo $GITHUB_REPO | sed 's/git@github.com:/https:\/\/github.com\//')
            git clone $HTTPS_REPO $PROJECT_DIR
        fi
    else
        log "Actualizando repositorio existente..."
        cd $PROJECT_DIR
        
        # Verificar estado del repositorio
        if [[ -n $(git status --porcelain) ]]; then
            warning "Cambios locales detectados, creando stash..."
            git stash push -m "Auto-stash antes de despliegue $(date)"
        fi
        
        # Actualizar desde origin
        git fetch origin
        git reset --hard origin/main
        git clean -fd
    fi
    
    cd $PROJECT_DIR
    log "✅ Repositorio actualizado"
}

# Función para crear backup
create_backup() {
    step "Creando Backup"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"
    
    mkdir -p $BACKUP_PATH
    
    # Backup de configuración
    if [ -f "$PROJECT_DIR/.env" ]; then
        cp $PROJECT_DIR/.env $BACKUP_PATH/
        log "✅ Configuración .env respaldada"
    fi
    
    # Backup de base de datos (si MongoDB está corriendo)
    if docker ps | grep -q mongo; then
        log "Creando backup de MongoDB..."
        docker exec -i $(docker ps | grep mongo | awk '{print $1}') mongodump --out /tmp/backup_$TIMESTAMP || true
        docker cp $(docker ps | grep mongo | awk '{print $1}'):/tmp/backup_$TIMESTAMP $BACKUP_PATH/mongodb/ || true
        log "✅ Base de datos respaldada"
    fi
    
    # Backup de logs si existen
    if [ -d "$PROJECT_DIR/logs" ]; then
        cp -r $PROJECT_DIR/logs $BACKUP_PATH/
    fi
    
    log "✅ Backup creado en: $BACKUP_PATH"
}

# Función para configurar variables de entorno
configure_environment() {
    step "Configurando Variables de Entorno"
    
    cd $PROJECT_DIR
    
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            log "Creando .env desde plantilla..."
            cp .env.example .env
        else
            error "No se encontró .env.example"
            return 1
        fi
    fi
    
    # Detectar IP del servidor
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')
    
    if [ ! -z "$SERVER_IP" ]; then
        log "IP del servidor detectada: $SERVER_IP"
        
        # Actualizar VITE_API_URL si contiene localhost
        if grep -q "localhost" .env; then
            warning "Actualizando URLs de localhost a IP del servidor..."
            sed -i "s/localhost/$SERVER_IP/g" .env
        fi
    fi
    
    # Verificar configuración crítica
    if grep -q "your-secret-key-here\|your-api-key-here" .env; then
        warning "⚠️  IMPORTANTE: Configura las claves secretas en .env"
        warning "⚠️  Usa claves seguras para ADMIN_SECRET_KEY y API_SECRET_KEY"
    fi
    
    log "✅ Variables de entorno configuradas"
}

# Función para verificar MongoDB
check_mongodb() {
    step "Verificando MongoDB"
    
    if docker ps | grep -q "60516.*mongo"; then
        log "✅ MongoDB encontrado en puerto 60516"
    else
        warning "MongoDB no encontrado en puerto 60516"
        info "¿Deseas crear un contenedor MongoDB? (y/N):"
        read -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Creando contenedor MongoDB..."
            docker run -d \
                --name mongodb-clinic \
                -p 60516:27017 \
                -v mongodb_clinic_data:/data/db \
                --restart unless-stopped \
                mongo:7.0
            sleep 5
            log "✅ MongoDB creado y ejecutándose"
        fi
    fi
}

# Función para hacer deploy
deploy_application() {
    step "Desplegando Aplicación"
    
    cd $PROJECT_DIR
    
    # Hacer ejecutables los scripts
    chmod +x scripts/*.sh
    
    # Detener servicios existentes
    if [ -f docker-compose.yml ]; then
        log "Deteniendo servicios existentes..."
        ./scripts/docker-stop.sh || docker-compose down --remove-orphans || true
    fi
    
    # Limpiar imágenes viejas en modo full
    if [ "$MODE" == "full" ]; then
        log "Limpiando imágenes Docker viejas..."
        docker system prune -a -f || true
    fi
    
    # Iniciar servicios
    log "Iniciando servicios en modo producción..."
    ./scripts/docker-start.sh production
    
    # Verificar que los servicios estén funcionando
    sleep 15
    
    log "Verificando servicios..."
    if docker-compose ps | grep -q "Up"; then
        log "✅ Servicios iniciados correctamente"
    else
        error "❌ Algunos servicios no iniciaron correctamente"
        docker-compose ps
        return 1
    fi
}

# Función para configurar servicio systemd
setup_systemd() {
    step "Configurando Arranque Automático"
    
    # Crear servicio systemd
    sudo tee /etc/systemd/system/dashboard-clinica.service > /dev/null <<EOF
[Unit]
Description=Dashboard Clinica Docker Services
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/scripts/docker-start.sh production
ExecStop=$PROJECT_DIR/scripts/docker-stop.sh
TimeoutStartSec=0
User=$USER

[Install]
WantedBy=multi-user.target
EOF
    
    # Habilitar servicio
    sudo systemctl daemon-reload
    sudo systemctl enable dashboard-clinica.service
    
    log "✅ Servicio systemd configurado"
}

# Función para configurar scripts de mantenimiento
setup_maintenance() {
    step "Configurando Scripts de Mantenimiento"
    
    # Script de backup automático
    cat > $PROJECT_DIR/scripts/auto-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/dashboard-clinica"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/opt/dashboard-clinica"

mkdir -p $BACKUP_DIR

# Backup de configuración
cp $PROJECT_DIR/.env $BACKUP_DIR/env_$TIMESTAMP.backup

# Backup de base de datos
if docker ps | grep -q mongo; then
    MONGO_CONTAINER=$(docker ps | grep mongo | awk '{print $1}')
    docker exec $MONGO_CONTAINER mongodump --out /tmp/backup_$TIMESTAMP
    docker cp $MONGO_CONTAINER:/tmp/backup_$TIMESTAMP $BACKUP_DIR/
fi

# Limpiar backups antiguos (mantener últimos 7 días)
find $BACKUP_DIR -type f -name "*backup*" -mtime +7 -delete

echo "$(date): Backup completado - $TIMESTAMP" >> /var/log/dashboard-clinica-backup.log
EOF
    
    chmod +x $PROJECT_DIR/scripts/auto-backup.sh
    
    # Agregar a crontab si no existe
    if ! crontab -l 2>/dev/null | grep -q "auto-backup.sh"; then
        (crontab -l 2>/dev/null; echo "0 2 * * * $PROJECT_DIR/scripts/auto-backup.sh") | crontab -
        log "✅ Backup automático configurado (diario a las 2:00 AM)"
    fi
}

# Función principal de verificación final
final_verification() {
    step "Verificación Final"
    
    cd $PROJECT_DIR
    
    # Verificar contenedores
    log "Estado de contenedores:"
    docker-compose ps
    
    # Verificar conectividad
    log "Verificando conectividad de servicios..."
    
    # Backend API
    if curl -s -f http://localhost:60522/health > /dev/null; then
        log "✅ Backend API respondiendo"
    else
        warning "❌ Backend API no responde"
    fi
    
    # Frontend Cliente
    if curl -s -f http://localhost:60521 > /dev/null; then
        log "✅ Frontend Cliente respondiendo"
    else
        warning "❌ Frontend Cliente no responde"
    fi
    
    # Admin Frontend (solo en desarrollo)
    if docker-compose ps | grep -q admin-frontend; then
        if curl -s -f http://localhost:60523 > /dev/null; then
            log "✅ Admin Frontend respondiendo"
        else
            warning "❌ Admin Frontend no responde"
        fi
    fi
    
    # Mostrar URLs de acceso
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || hostname -I | awk '{print $1}')
    
    echo -e "\n${GREEN}🎉 ¡Despliegue completado exitosamente!${NC}"
    echo -e "${BLUE}📱 URLs de acceso:${NC}"
    echo -e "  Frontend Cliente:   http://$SERVER_IP:60521"
    echo -e "  Backend API:        http://$SERVER_IP:60522"
    echo -e "  API Docs:           http://$SERVER_IP:60522/docs"
    
    if docker-compose ps | grep -q admin-frontend; then
        echo -e "  Admin Frontend:     http://$SERVER_IP:60523"
    fi
    
    echo -e "\n${YELLOW}📝 Notas importantes:${NC}"
    echo -e "  • Configura las claves secretas en .env para producción"
    echo -e "  • Considera configurar SSL con Nginx/Certbot"
    echo -e "  • Los backups automáticos están configurados"
    echo -e "  • Usa 'systemctl status dashboard-clinica' para monitorear"
}

# Función principal
main() {
    case $MODE in
        "setup")
            setup_server
            check_dependencies
            manage_repository
            configure_environment
            check_mongodb
            deploy_application
            setup_systemd
            setup_maintenance
            final_verification
            ;;
        "update")
            check_dependencies
            create_backup
            manage_repository
            configure_environment
            deploy_application
            final_verification
            ;;
        "full")
            check_dependencies
            create_backup
            manage_repository
            configure_environment
            check_mongodb
            deploy_application
            setup_systemd
            setup_maintenance
            final_verification
            ;;
    esac
}

# Logging de inicio
echo "$(date): Iniciando despliegue modo $MODE" >> $LOG_FILE

# Trap para manejo de errores
trap 'error "Despliegue falló en línea $LINENO. Ver logs: $LOG_FILE"' ERR

# Ejecutar función principal
main

log "🏥 ¡Dashboard Clínica desplegado exitosamente!"
echo "$(date): Despliegue completado exitosamente" >> $LOG_FILE