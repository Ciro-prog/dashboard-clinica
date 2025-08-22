#!/bin/bash
# Script para crear usuario admin inicial

echo "🔧 Creando usuario admin inicial..."

# Ejecutar script dentro del contenedor
docker exec clinic-admin-system python create_admin.py

if [ $? -eq 0 ]; then
    echo "✅ Usuario admin creado exitosamente"
    echo "Credenciales:"
    echo "  Username: admin"
    echo "  Password: admin123"
else
    echo "❌ Error creando usuario admin"
    echo "Intentando método alternativo..."
    
    # Método alternativo: crear directamente en MongoDB
    docker exec clinic-admin-system python -c "
import asyncio
from datetime import datetime
from app.core.database import connect_to_mongo, get_collection, close_mongo_connection
from app.auth.security import get_password_hash

async def create_admin():
    await connect_to_mongo()
    admins_collection = await get_collection('admins')
    
    # Verificar si ya existe
    existing = await admins_collection.find_one({'username': 'admin'})
    if existing:
        print('[OK] Admin ya existe')
        return
    
    # Crear admin
    admin_data = {
        'username': 'admin',
        'email': 'admin@admin.com',
        'full_name': 'Super Admin',
        'password_hash': get_password_hash('admin123'),
        'role': 'super_admin',
        'is_active': True,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
        'last_login': None
    }
    
    result = await admins_collection.insert_one(admin_data)
    print(f'[OK] Admin creado: {result.inserted_id}')
    await close_mongo_connection()

asyncio.run(create_admin())
"
fi

echo "🧪 Verificando login..."
curl -X POST "http://localhost:60519/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "admin123", "user_type": "admin"}'

echo ""
echo "🎉 Proceso completado. Intenta hacer login nuevamente."