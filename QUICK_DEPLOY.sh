#!/bin/bash

# 🚀 CLINIC ADMIN SYSTEM - QUICK DEPLOY SCRIPT
# Este script automatiza todo el proceso de deployment

set -e  # Exit on any error

echo "🏥 CLINIC ADMIN SYSTEM - QUICK DEPLOY"
echo "====================================="

# Variables
REPO_URL="https://github.com/YOUR_USERNAME/dashboard-clinica.git"  # CAMBIAR POR TU REPO
DEPLOY_DIR="/var/www/clinic-admin"
SERVICE_NAME="clinic-admin"
DOMAIN="your-domain.com"  # CAMBIAR POR TU DOMINIO

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "No ejecutar como root. Usar sudo cuando sea necesario."
   exit 1
fi

# Step 1: Update system and install dependencies
print_step "1. Actualizando sistema e instalando dependencias..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git python3 python3-pip python3-venv nodejs npm nginx certbot python3-certbot-nginx ufw jq

# Step 2: Install Docker
print_step "2. Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    print_warning "Reiniciar sesión después del deployment para usar Docker sin sudo"
fi

if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Step 3: Install and configure MongoDB
print_step "3. Instalando MongoDB..."
if ! command -v mongod &> /dev/null; then
    # Fix MongoDB repository for Ubuntu Noble (24.04)
    wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
    
    # Detect Ubuntu version and use appropriate repository
    UBUNTU_VERSION=$(lsb_release -cs)
    if [ "$UBUNTU_VERSION" = "noble" ]; then
        # Use jammy repository for noble (Ubuntu 24.04)
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        print_warning "Using jammy repository for Ubuntu Noble (24.04)"
    else
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $UBUNTU_VERSION/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    fi
    
    sudo apt update
    sudo apt install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
fi

# Step 4: Clone repository
print_step "4. Clonando repositorio..."
if [ -d "$DEPLOY_DIR" ]; then
    print_warning "Directorio existe. Actualizando..."
    cd $DEPLOY_DIR
    git pull origin main
else
    sudo git clone $REPO_URL $DEPLOY_DIR
    sudo chown -R $USER:$USER $DEPLOY_DIR
fi

cd $DEPLOY_DIR

# Step 5: Setup Python environment
print_step "5. Configurando entorno Python..."
cd clinic-admin-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Step 6: Build frontend
print_step "6. Compilando frontend admin..."
cd frontend-admin
npm install
npm run build
cd ..

# Copy frontend to static
rm -rf static/admin
mkdir -p static/admin
cp -r frontend-admin/dist/* static/admin/

# Step 7: Configure environment variables
print_step "7. Configurando variables de entorno..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
MONGODB_URL=mongodb://localhost:27017/clinic_admin
JWT_SECRET_KEY=$(openssl rand -base64 32)
API_KEY_PROD=$(openssl rand -base64 24)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$(openssl rand -base64 16)
ENVIRONMENT=production
DEBUG=false
ALLOWED_ORIGINS=https://$DOMAIN,http://localhost
EOF
    print_warning "Variables de entorno creadas. Revisar .env para personalizar."
else
    print_warning "Archivo .env existe. No sobrescribiendo."
fi

# Step 8: Create systemd service
print_step "8. Creando servicio systemd..."
sudo tee /etc/systemd/system/$SERVICE_NAME.service > /dev/null << EOF
[Unit]
Description=Clinic Admin Backend
After=network.target mongod.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$DEPLOY_DIR/clinic-admin-backend
Environment=PATH=$DEPLOY_DIR/clinic-admin-backend/venv/bin
EnvironmentFile=$DEPLOY_DIR/clinic-admin-backend/.env
ExecStart=$DEPLOY_DIR/clinic-admin-backend/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME

# Step 9: Configure Nginx
print_step "9. Configurando Nginx..."
sudo tee /etc/nginx/sites-available/clinic-admin > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        return 301 /admin;
    }

    location /admin {
        proxy_pass http://localhost:8000/admin;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api {
        proxy_pass http://localhost:8000/api;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /docs {
        proxy_pass http://localhost:8000/docs;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/clinic-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Step 10: Configure firewall
print_step "10. Configurando firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw deny 8000  # Block direct access to backend

# Step 11: Start services
print_step "11. Iniciando servicios..."
sudo systemctl start $SERVICE_NAME

# Wait for service to start
sleep 5

# Step 12: Health check
print_step "12. Verificando despliegue..."
if curl -s http://localhost:8000/health | jq -r '.status' | grep -q "healthy"; then
    print_step "✅ Backend is healthy"
else
    print_error "❌ Backend health check failed"
    print_warning "Checking logs..."
    sudo journalctl -u $SERVICE_NAME -n 20
fi

# Step 13: Setup SSL (optional)
print_step "13. ¿Configurar SSL? (y/N)"
read -r ssl_response
if [[ "$ssl_response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    print_step "Configurando SSL con Let's Encrypt..."
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
fi

# Step 14: Create maintenance scripts
print_step "14. Creando scripts de mantenimiento..."

# Update script
sudo tee /usr/local/bin/clinic-update.sh > /dev/null << 'EOF'
#!/bin/bash
set -e
cd /var/www/clinic-admin
git pull origin main
cd clinic-admin-backend
source venv/bin/activate
pip install -r requirements.txt
cd frontend-admin
npm install
npm run build
cd ..
rm -rf static/admin
mkdir -p static/admin
cp -r frontend-admin/dist/* static/admin/
sudo systemctl restart clinic-admin
echo "✅ Update completed"
EOF

# Backup script
sudo tee /usr/local/bin/clinic-backup.sh > /dev/null << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/clinic-admin"
mkdir -p $BACKUP_DIR
mongodump --out $BACKUP_DIR/mongodb_$DATE
tar -czf $BACKUP_DIR/code_$DATE.tar.gz -C /var/www clinic-admin
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "mongodb_*" -mtime +7 -exec rm -rf {} \;
echo "✅ Backup completed: $DATE"
EOF

sudo chmod +x /usr/local/bin/clinic-update.sh
sudo chmod +x /usr/local/bin/clinic-backup.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/clinic-backup.sh") | crontab -

print_step "15. Deployment completado! 🎉"
echo ""
echo "=================================="
echo "🎉 DEPLOYMENT EXITOSO"
echo "=================================="
echo ""
echo "📋 INFORMACIÓN DE ACCESO:"
echo "🏠 Homepage:        http://$DOMAIN"
echo "🖥️  Admin Dashboard: http://$DOMAIN/admin"
echo "🔧 API Backend:     http://$DOMAIN/api"
echo "📚 API Docs:        http://$DOMAIN/docs"
echo "💚 Health Check:    http://$DOMAIN/health"
echo ""
echo "🔐 CREDENCIALES ADMIN:"
echo "   Usuario: admin"
echo "   Contraseña: $(grep ADMIN_PASSWORD $DEPLOY_DIR/clinic-admin-backend/.env | cut -d'=' -f2)"
echo ""
echo "📋 COMANDOS ÚTILES:"
echo "   Ver logs:         sudo journalctl -u $SERVICE_NAME -f"
echo "   Reiniciar:        sudo systemctl restart $SERVICE_NAME"
echo "   Actualizar:       sudo /usr/local/bin/clinic-update.sh"
echo "   Backup:           sudo /usr/local/bin/clinic-backup.sh"
echo ""
echo "🔧 ARCHIVOS IMPORTANTES:"
echo "   Configuración:    $DEPLOY_DIR/clinic-admin-backend/.env"
echo "   Servicio:         /etc/systemd/system/$SERVICE_NAME.service"
echo "   Nginx:            /etc/nginx/sites-available/clinic-admin"
echo ""
echo "✅ Para acceder al ApiDocumentationModal:"
echo "   1. Ir a http://$DOMAIN/admin"
echo "   2. Login con credenciales admin"
echo "   3. Tab 'Clínicas' → Botón 'Documentación'"
echo ""
print_warning "IMPORTANTE: Guardar la contraseña de admin mostrada arriba"
print_warning "Revisar el archivo .env para personalizar configuración"

if [[ "$ssl_response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "🔒 SSL configurado. Usar HTTPS:"
    echo "🖥️  Admin Dashboard: https://$DOMAIN/admin"
fi