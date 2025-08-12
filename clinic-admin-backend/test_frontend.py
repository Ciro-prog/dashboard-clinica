#!/usr/bin/env python3
"""
Script para probar el frontend completo del admin
"""

import asyncio
import aiohttp
import webbrowser
from pathlib import Path

async def test_frontend():
    """Probar el frontend completo"""
    print("[TESTING] Probando frontend del admin...")
    
    base_url = "http://localhost:8000"
    
    async with aiohttp.ClientSession() as session:
        # 1. Verificar que el HTML principal se sirve
        print("\n1. Verificando HTML principal...")
        async with session.get(f"{base_url}/admin/") as response:
            if response.status == 200:
                html = await response.text()
                if '<div id="root"></div>' in html:
                    print("   [OK] HTML principal OK")
                else:
                    print("   [ERROR] HTML principal no contiene div#root")
                    return False
            else:
                print(f"   [ERROR] Error en HTML principal: {response.status}")
                return False
        
        # 2. Verificar que los assets se cargan
        print("\n2. Verificando assets...")
        js_found = False
        css_found = False
        
        # Buscar los archivos JS y CSS en el HTML
        lines = html.split('\n')
        for line in lines:
            if 'src="/admin/assets/' and '.js' in line:
                js_file = line.split('src="')[1].split('"')[0]
                print(f"   Encontrado JS: {js_file}")
                async with session.get(f"{base_url}{js_file}") as js_response:
                    if js_response.status == 200:
                        print("   [OK] JavaScript OK")
                        js_found = True
                    else:
                        print(f"   [ERROR] Error en JavaScript: {js_response.status}")
            
            if 'href="/admin/assets/' and '.css' in line:
                css_file = line.split('href="')[1].split('"')[0]
                print(f"   Encontrado CSS: {css_file}")
                async with session.get(f"{base_url}{css_file}") as css_response:
                    if css_response.status == 200:
                        print("   [OK] CSS OK")
                        css_found = True
                    else:
                        print(f"   [ERROR] Error en CSS: {css_response.status}")
        
        if not js_found or not css_found:
            print("   [ERROR] No se encontraron todos los assets")
            return False
        
        # 3. Verificar API de login
        print("\n3. Verificando API de login...")
        login_data = {
            "username": "admin",
            "password": "admin123",
            "user_type": "admin"
        }
        
        async with session.post(f"{base_url}/api/auth/login", json=login_data) as login_response:
            if login_response.status == 200:
                login_result = await login_response.json()
                if 'access_token' in login_result:
                    print("   [OK] API de login OK")
                    token = login_result['access_token']
                else:
                    print("   [ERROR] API de login no devuelve token")
                    return False
            else:
                print(f"   [ERROR] Error en API de login: {login_response.status}")
                return False
        
        # 4. Verificar API de admin con token
        print("\n4. Verificando API de admin...")
        headers = {"Authorization": f"Bearer {token}"}
        async with session.get(f"{base_url}/api/admin/dashboard/stats", headers=headers) as stats_response:
            if stats_response.status == 200:
                stats = await stats_response.json()
                if 'total_clinics' in stats:
                    print("   [OK] API de admin OK")
                    print(f"   Estadisticas: {stats['total_clinics']} clinicas totales")
                else:
                    print("   [ERROR] API de admin no devuelve estadisticas")
                    return False
            else:
                print(f"   [ERROR] Error en API de admin: {stats_response.status}")
                return False
    
    print("\n[SUCCESS] Todos los tests pasaron exitosamente!")
    print("\n[URL] Frontend disponible en: http://localhost:8000/admin/")
    print("[CREDENCIALES] Datos de acceso:")
    print("   Usuario: admin")
    print("   Contrasena: admin123")
    
    # Abrir navegador automáticamente
    print("\n[BROWSER] Abriendo en el navegador...")
    webbrowser.open(f"{base_url}/admin/")
    
    return True

if __name__ == "__main__":
    try:
        result = asyncio.run(test_frontend())
        if result:
            print("\n[FINAL] El sistema admin esta completamente funcional!")
        else:
            print("\n[FINAL] Hay problemas con el sistema admin.")
    except Exception as e:
        print(f"\n[ERROR] Error durante las pruebas: {e}")
        print("Asegurate de que el servidor backend este ejecutandose.")