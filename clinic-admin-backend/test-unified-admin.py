#!/usr/bin/env python3
"""
Script de testing para verificar el admin unificado
"""
import requests
import os
from pathlib import Path

def test_unified_admin():
    print("TESTING ADMIN UNIFICADO")
    print("=" * 50)
    
    # Verificar archivos estáticos
    static_dir = Path("static/admin")
    if static_dir.exists():
        print(f"[OK] Directorio static/admin existe")
        index_file = static_dir / "index.html"
        if index_file.exists():
            print(f"[OK] index.html encontrado")
            # Verificar contenido
            with open(index_file, 'r') as f:
                content = f.read()
                if '/admin/assets/' in content:
                    print(f"[OK] Paths de assets correctos (/admin/assets/)")
                else:
                    print(f"[ERROR] Paths de assets incorrectos")
        else:
            print(f"[ERROR] index.html NO encontrado")
    else:
        print(f"[ERROR] Directorio static/admin NO existe")
    
    # Verificar que legacy frontend no existe
    legacy_dir = Path("frontend/dist")
    if not legacy_dir.exists():
        print(f"[OK] Frontend legacy removido correctamente")
    else:
        print(f"[WARNING] Frontend legacy aún existe")
    
    print()
    print("INSTRUCCIONES:")
    print("1. Ejecuta: python main.py")
    print("2. Ve a: http://localhost:8000/admin")
    print("3. Deberías ver el admin COMPLETO con:")
    print("   - Tema oscuro (bg-slate-900)")
    print("   - Tarjetas modernas")
    print("   - EnhancedPaymentManagementModal")
    print("   - BulkProfessionalCreator")
    print("   - Todas las funcionalidades")

if __name__ == "__main__":
    test_unified_admin()