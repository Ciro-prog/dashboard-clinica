#!/bin/bash
# Script para hacer ejecutables todos los scripts .sh

echo "🔧 Haciendo ejecutables los scripts de producción..."

# Navigate to scripts directory
cd "$(dirname "$0")"

# Make all .sh files executable
chmod +x *.sh

echo "✅ Scripts configurados como ejecutables:"
ls -la *.sh

echo ""
echo "📋 Ahora puedes ejecutar:"
echo "   ./production-complete-restart.sh"
echo "   ./quick-production-check.sh"
echo ""