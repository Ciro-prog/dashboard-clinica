# Frontend Cliente - Sistema Principal de Clínicas
FROM node:18-alpine AS build

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY eslint.config.js ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build de producción
RUN npm run build

# Imagen de producción con nginx
FROM nginx:alpine

# Copiar archivos build
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración nginx simple (sin proxy problemático)
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;
    }
    
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]