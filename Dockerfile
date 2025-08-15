# Multi-stage build para optimizar imagen final
FROM node:18-alpine as builder

# Instalar dependencias necesarias para el build
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar archivos de configuración del package manager
COPY package*.json ./
COPY bun.lockb* ./

# Instalar dependencias (usar npm como fallback sino hay bun.lockb)
RUN if [ -f bun.lockb ]; then \
    npm install -g bun && bun install --frozen-lockfile; \
    else \
    npm ci && npm cache clean --force; \
    fi

# Copiar código fuente
COPY . .

# Variables de entorno para el build
ENV VITE_API_URL=http://localhost:60522
ENV NODE_ENV=production

# Build de la aplicación
RUN if [ -f bun.lockb ]; then \
    bun run build; \
    else \
    npm run build; \
    fi

# Etapa de producción con Nginx
FROM nginx:alpine

# Copiar configuración personalizada de Nginx
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Servir archivos estáticos
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
        
        # Cache para archivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Proxy para API requests al backend
    location /api/ {
        proxy_pass http://host.docker.internal:60522/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";
        
        # Handle preflight requests
        if (\$request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type";
            return 204;
        }
    }
}
EOF

# Copiar archivos build desde la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Crear directorio para logs
RUN mkdir -p /var/log/nginx

# Exponer puerto
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
