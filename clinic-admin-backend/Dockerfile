# Usar Python 3.11 slim para compatibilidad con Pandas
FROM python:3.11-slim

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root para seguridad
RUN useradd --create-home --shell /bin/bash app

# Establecer directorio de trabajo
WORKDIR /app

# Copiar requirements primero para aprovechar cache de Docker
COPY requirements.txt ./
COPY requirements-minimal.txt ./

# Instalar dependencias de Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Crear directorio para uploads y logs
RUN mkdir -p /app/uploads /app/logs && \
    chown -R app:app /app

# Cambiar a usuario no-root
USER app

# Variables de entorno
ENV PYTHONPATH=/app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Configuración de la aplicación
ENV MONGODB_URL=mongodb://host.docker.internal:60516/clinic_dashboard
ENV ADMIN_SECRET_KEY=your-super-secret-admin-key-change-in-production
ENV API_SECRET_KEY=your-api-secret-key-change-in-production
ENV ADMIN_SESSION_DURATION=24
ENV ALLOW_ORIGINS=["http://localhost:60521","http://localhost:60523","http://host.docker.internal:60521","http://host.docker.internal:60523"]

# Exponer puerto
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando para inicializar datos si es necesario
COPY <<EOF /app/init.sh
#!/bin/bash
set -e

echo "🚀 Starting Clinic Admin Backend..."
echo "📊 MongoDB URL: \$MONGODB_URL"

# Verificar conexión a MongoDB
echo "🔍 Checking MongoDB connection..."
python -c "
import asyncio
from app.core.database import connect_to_mongo
try:
    asyncio.run(connect_to_mongo())
    print('✅ MongoDB connection successful')
except Exception as e:
    print(f'❌ MongoDB connection failed: {e}')
    exit(1)
"

# Inicializar datos de prueba si es necesario
if [ "\$INIT_TEST_DATA" = "true" ]; then
    echo "📝 Initializing test data..."
    python init_db.py || echo "⚠️ Init data script failed (may be normal)"
fi

# Iniciar aplicación
echo "🎯 Starting FastAPI server on port 8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level info
EOF

RUN chmod +x /app/init.sh

# Comando de inicio
CMD ["/app/init.sh"]