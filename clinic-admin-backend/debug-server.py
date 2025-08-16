#!/usr/bin/env python3
"""
Debug script para probar rutas del servidor
"""
import requests
import os
from pathlib import Path

def test_server_routes():
    print("🔍 DEBUGGING SERVER ROUTES")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    # Test basic endpoints
    endpoints_to_test = [
        "/",
        "/health", 
        "/admin",
        "/admin/",
        "/api/info",
    ]
    
    for endpoint in endpoints_to_test:
        url = f"{base_url}{endpoint}"
        try:
            print(f"\n🌐 Testing: {url}")
            response = requests.get(url, timeout=5)
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                content_type = response.headers.get('content-type', 'unknown')
                print(f"   Content-Type: {content_type}")
                if 'application/json' in content_type:
                    print(f"   Response: {response.json()}")
                elif 'text/html' in content_type:
                    print(f"   HTML Length: {len(response.text)} chars")
                    if '<title>' in response.text:
                        title_start = response.text.find('<title>') + 7
                        title_end = response.text.find('</title>')
                        title = response.text[title_start:title_end] if title_end > title_start else "No title"
                        print(f"   Page Title: {title}")
            else:
                print(f"   Error Response: {response.text[:200]}")
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection failed - Server not running?")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("📋 INSTRUCTIONS:")
    print("1. If connection failed: run 'python main.py' first")
    print("2. If /admin returns 404: check static file mounting")
    print("3. If /admin returns JSON error: SPA routing issue")
    print("4. Expected: /admin should return HTML with title 'salud-inteligente-dashboard'")

if __name__ == "__main__":
    test_server_routes()