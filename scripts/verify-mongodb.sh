#!/bin/bash
# Script para verificar configuración MongoDB

echo "🔍 Verificando configuración MongoDB..."

echo "📊 Estado del contenedor MongoDB:"
docker ps | grep mongo

echo ""
echo "🗄️ Colecciones existentes:"
docker exec clinic-admin-system python -c "
import asyncio
from app.core.database import connect_to_mongo, get_database, close_mongo_connection

async def check_collections():
    await connect_to_mongo()
    db = await get_database()
    collections = await db.list_collection_names()
    print('Colecciones existentes:')
    for col in collections:
        print(f'  - {col}')
        
    # Verificar específicamente la colección admins
    if 'admins' in collections:
        admins_collection = db['admins']
        count = await admins_collection.count_documents({})
        print(f'\\nColección admins: {count} documentos')
        
        if count > 0:
            admin = await admins_collection.find_one({})
            print(f'Primer admin: {admin.get(\"username\", \"N/A\")}')
    else:
        print('\\n❌ Colección admins NO existe')
    
    await close_mongo_connection()

asyncio.run(check_collections())
"

echo ""
echo "🧪 Test de conexión:"
curl -s http://localhost:60519/health | jq .