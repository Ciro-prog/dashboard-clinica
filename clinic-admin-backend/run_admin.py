#!/usr/bin/env python3
"""
ClinicaAdmin - Sistema de Administración de Clínicas
Ejecuta el servidor FastAPI con frontend React integrado
"""

import os
import sys
import uvicorn
from pathlib import Path

def check_requirements():
    """Verificar que los requisitos estén cumplidos"""
    print("🔍 Verificando requisitos del sistema...")
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists("main.py"):
        print("❌ Error: Ejecuta este script desde la carpeta clinic-admin-backend/")
        sys.exit(1)
    
    # Verificar que el frontend esté construido
    frontend_dist = Path("frontend/dist/index.html")
    if not frontend_dist.exists():
        print("⚠️  Frontend no construido. Construyendo...")
        import subprocess
        try:
            subprocess.run(["npm", "run", "build"], cwd="frontend", check=True)
            print("✅ Frontend construido correctamente")
        except subprocess.CalledProcessError:
            print("❌ Error construyendo frontend. Asegúrate de haber ejecutado 'npm install' en frontend/")
            sys.exit(1)
    else:
        print("✅ Frontend disponible")
    
    print("✅ Todos los requisitos cumplidos")

def show_info():
    """Mostrar información del sistema"""
    print("\n" + "="*50)
    print("  🏥 ClinicaAdmin - Sistema Administrativo")
    print("="*50)
    print("\n📍 URLs disponibles:")
    print("   🖥️  Panel Admin:  http://localhost:8000/admin")
    print("   📚 API Docs:     http://localhost:8000/docs") 
    print("   ⚡ Backend:      http://localhost:8000")
    print("\n🔑 Credenciales de acceso:")
    print("   👤 Usuario:      admin")
    print("   🔒 Contraseña:   admin123")
    print("\n⚠️  Para detener el servidor: Ctrl+C")
    print("="*50 + "\n")

def main():
    """Función principal"""
    try:
        check_requirements()
        show_info()
        
        # Configuración del servidor
        config = {
            "app": "main:app",
            "host": "0.0.0.0", 
            "port": 8000,
            "reload": True,
            "log_level": "info"
        }
        
        print("🚀 Iniciando servidor...")
        uvicorn.run(**config)
        
    except KeyboardInterrupt:
        print("\n\n👋 Servidor detenido correctamente")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()