# 🔧 TROUBLESHOOTING - Desarrollo Dual

## 🚨 Problemas Comunes y Soluciones

### ❌ Script se detiene después de verificar Node.js/npm

**Causa:** Error en instalación de dependencias

**Solución Manual:**
```bash
# 1. Instalar dependencias del cliente
npm install

# 2. Instalar dependencias del admin  
cd clinic-admin-backend\frontend-admin
npm install
cd ..\..

# 3. Iniciar cliente en una ventana
npm run dev

# 4. Iniciar admin en otra ventana
cd clinic-admin-backend\frontend-admin
npm run dev
```

### ❌ Error "npm install failed"

**Soluciones:**
```bash
# Limpiar cache de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rmdir /s node_modules
npm install

# Verificar permisos
npm config get prefix
```

### ❌ Error "Puerto ya en uso"

**Verificar puertos:**
```bash
# Verificar puerto 8080
netstat -ano | findstr :8080

# Verificar puerto 5173  
netstat -ano | findstr :5173

# Matar proceso si es necesario
taskkill /PID <PID> /F
```

### ❌ Error de conexión al backend

**Verificar:**
```bash
# Probar backend manualmente
curl http://pampaservers.com:60519/health

# Verificar DNS
nslookup pampaservers.com

# Probar con IP directa si es necesario
curl http://[IP]:60519/health
```

### ❌ Dependencias no se instalan

**Causas comunes:**
1. **Proxy corporativo**: Configurar npm proxy
2. **Antivirus**: Desactivar temporalmente
3. **Permisos**: Ejecutar como administrador
4. **Versión Node.js**: Verificar compatibilidad

**Soluciones:**
```bash
# Configurar proxy (si aplica)
npm config set proxy http://proxy:puerto
npm config set https-proxy http://proxy:puerto

# Usar npm alternativo
npm install --registry https://registry.npmmirror.com

# Instalar con yarn (alternativa)
npm install -g yarn
yarn install
```

## 🎯 Comandos de Desarrollo Manual

### Opción 1: Desarrollo Paso a Paso

```bash
# Terminal 1: Cliente
npm install
npm run dev
# → http://localhost:8080

# Terminal 2: Admin  
cd clinic-admin-backend\frontend-admin
npm install
npm run dev
# → http://localhost:5173
```

### Opción 2: Scripts Individuales

```bash
# Solo cliente
start-client-dev.bat

# Solo admin
start-admin-dev.bat
```

### Opción 3: Script Mejorado

```bash
# Con mejor manejo de errores
start-dual-dev-fixed.bat
```

## 🔍 Verificación de Estado

### Backend
```bash
curl http://pampaservers.com:60519/health
```
**Respuesta esperada:**
```json
{"status":"healthy","service":"clinic-admin-backend","version":"1.0.0","database":"connected"}
```

### Cliente Frontend
```bash
# Debe responder en puerto 8080
curl http://localhost:8080
```

### Admin Frontend  
```bash
# Debe responder en puerto 5173
curl http://localhost:5173
```

## 🚀 URLs de Desarrollo

Una vez funcionando:

- 👥 **Cliente**: http://localhost:8080
- 🔧 **Admin**: http://localhost:5173  
- 📚 **API Docs**: http://pampaservers.com:60519/docs
- ⚡ **Backend Health**: http://pampaservers.com:60519/health

## 📞 Diagnóstico Rápido

Si el script falla, ejecutar:

```bash
# Verificar todo el entorno
node --version
npm --version
curl http://pampaservers.com:60519/health
npm ls --depth=0
```

## 🔧 Reset Completo

Si nada funciona:

```bash
# 1. Limpiar todo
rmdir /s node_modules
rmdir /s clinic-admin-backend\frontend-admin\node_modules
npm cache clean --force

# 2. Reinstalar todo
npm install
cd clinic-admin-backend\frontend-admin
npm install
cd ..\..

# 3. Probar scripts individuales
start-client-dev.bat
start-admin-dev.bat
```