# Usar Node.js 18 LTS para el admin frontend
FROM node:18-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache curl

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S app -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de Node.js
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente del admin frontend
COPY . .

# Crear directorio para logs y cambiar permisos
RUN mkdir -p /app/logs && chown -R app:nodejs /app

# Cambiar a usuario no-root
USER app

# Variables de entorno para el admin frontend
ENV NODE_ENV=production
ENV VITE_API_URL=http://localhost:60522
ENV VITE_ADMIN_API_URL=http://localhost:60522/api

# Exponer puerto para desarrollo
EXPOSE 5173

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5173 || exit 1

# Script de inicio para el admin frontend
COPY <<EOF /app/start.sh
#!/bin/sh
set -e

echo "🎨 Starting Admin Frontend..."
echo "📊 API URL: \$VITE_API_URL"
echo "🔧 Admin API URL: \$VITE_ADMIN_API_URL"

# Verificar si existe build
if [ -d "dist" ]; then
    echo "📦 Found existing build, serving static files..."
    npx serve -s dist -l 5173
else
    echo "🔄 No build found, starting dev server..."
    npm run dev -- --host 0.0.0.0 --port 5173
fi
EOF

RUN chmod +x /app/start.sh

# Comando de inicio
CMD ["/app/start.sh"]