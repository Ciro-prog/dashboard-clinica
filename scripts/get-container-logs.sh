#!/bin/bash
# Script simple para obtener logs inmediatos

echo "=== LOGS ADMIN SYSTEM ==="
echo "Últimas 30 líneas:"
docker logs clinic-admin-system --tail=30 2>&1

echo ""
echo "=== LOGS FRONTEND CLIENT ==="
echo "Últimas 30 líneas:"
docker logs clinic-frontend-client --tail=30 2>&1

echo ""
echo "=== ESTADO ACTUAL ==="
docker ps --filter "name=clinic"