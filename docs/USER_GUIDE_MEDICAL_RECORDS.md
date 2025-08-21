# 📋 Guía de Usuario: Sistema de Historiales Clínicos

## 🎯 **Introducción**

El nuevo sistema de historiales clínicos integra almacenamiento en la nube (MinIO) con búsqueda avanzada para proporcionar una gestión completa y segura de los registros médicos de sus pacientes.

---

## 🚀 **Acceso al Sistema**

### Navegación
1. **Iniciar sesión** en el sistema con sus credenciales de clínica
2. **Acceder al dashboard** administrativo
3. **Hacer clic en la pestaña "Historiales"** en el menú principal

### Interfaz Principal
El sistema cuenta con tres secciones principales:
- **Panel de Estadísticas**: Resumen rápido de pacientes y documentos
- **Búsqueda de Pacientes**: Herramientas de búsqueda avanzada
- **Gestión de Documentos**: Visualización y administración de archivos médicos

---

## 📊 **Panel de Estadísticas**

### Métricas Disponibles
- **Total de Pacientes**: Número total de pacientes registrados
- **Pacientes Activos**: Pacientes con estado activo
- **Total de Documentos**: Cantidad total de documentos médicos almacenados
- **Documentos Recientes**: Archivos subidos en los últimos 30 días

### Actualización de Datos
- Las estadísticas se actualizan automáticamente
- Usar el botón **"Actualizar Estadísticas"** para refrescar manualmente

---

## 🔍 **Búsqueda Avanzada de Pacientes**

### Criterios de Búsqueda
El sistema permite buscar pacientes por múltiples criterios:

#### **Información Básica**
- **Nombre y Apellido**: Búsqueda parcial o completa
- **DNI**: Número de documento
- **Teléfono**: Número de contacto
- **Email**: Dirección de correo electrónico

#### **Filtros Adicionales**
- **Estado del Paciente**:
  - Activos
  - Inactivos  
  - Archivados
- **Ordenamiento**:
  - Última visita (recomendado)
  - Nombre alfabético
  - Fecha de registro

### Cómo Realizar una Búsqueda
1. **Ingresar términos** en el campo de búsqueda principal
2. **Seleccionar filtros** apropiados (estado, ordenamiento)
3. **Hacer clic en "Buscar"** o presionar Enter
4. **Revisar resultados** en la lista de pacientes

### Interpretación de Resultados
Cada resultado muestra:
- **Información del paciente**: Nombre, DNI, teléfono
- **Estado**: Badge de color indicando estado actual
- **Documentos**: Cantidad de archivos médicos
- **Última visita**: Fecha de la consulta más reciente
- **Acciones**: Botones para ver historial y documentos

---

## 📁 **Gestión de Documentos Médicos**

### Tipos de Documentos Soportados
- **Registros Médicos**: Historias clínicas, notas de evolución
- **Resultados de Laboratorio**: Análisis, estudios de sangre
- **Imágenes Médicas**: Radiografías, ecografías, tomografías
- **Prescripciones**: Recetas médicas, planes de tratamiento
- **Otros**: Consentimientos, formularios, reportes

### Formatos de Archivo Permitidos
- **Documentos**: PDF, DOC, DOCX, TXT
- **Imágenes**: JPG, JPEG, PNG, GIF, BMP
- **Tamaño máximo**: 10 MB por archivo

### Subida de Documentos
1. **Seleccionar paciente** desde la búsqueda
2. **Hacer clic en "Documentos"** en la tarjeta del paciente
3. **Usar el botón "Subir Documento"**
4. **Completar información**:
   - Seleccionar archivo
   - Elegir tipo de documento
   - Añadir descripción (opcional)
5. **Confirmar la subida**

### Visualización de Documentos
- **Lista de documentos**: Por paciente, ordenados por fecha
- **Información de archivo**: Nombre, tipo, tamaño, fecha de subida
- **Descarga segura**: URLs firmadas con expiración temporal
- **Vista previa**: Para PDFs e imágenes compatibles

---

## 🔒 **Seguridad y Privacidad**

### Protección de Datos
- **Aislamiento por clínica**: Cada clínica solo ve sus propios pacientes
- **Storage en la nube**: Almacenamiento seguro con MinIO
- **URLs firmadas**: Links de descarga con expiración automática
- **Logs de acceso**: Registro de todas las acciones en documentos

### Permisos de Acceso
- **Profesionales de la clínica**: Acceso completo a pacientes de su clínica
- **Compartir entre profesionales**: Sistema de permisos granular
- **Historial de acceso**: Registro de quién accede a qué documentos

### Cumplimiento Normativo
- **GDPR/LGPD**: Cumplimiento con regulaciones de protección de datos
- **HIPAA**: Estándares de privacidad médica
- **Backup automático**: Respaldo continuo de información crítica

---

## ⚡ **Características Avanzadas**

### Búsqueda en Notas Médicas
- Buscar texto dentro de las notas médicas del paciente
- Filtrar por diagnósticos específicos
- Encontrar tratamientos aplicados

### Análisis de Historiales
- **Cobertura de documentos**: Porcentaje de pacientes con archivos
- **Actividad reciente**: Documentos subidos en período específico
- **Estadísticas por tipo**: Distribución de tipos de documentos

### Migración de Datos
- **Migración automática**: Transferir archivos locales a MinIO
- **Verificación de integridad**: Comprobación de archivos migrados
- **Reporte de migración**: Detalles del proceso de transferencia

---

## 🛠️ **Solución de Problemas**

### Problemas Comunes

#### **"No se pueden cargar los pacientes"**
- Verificar conexión a internet
- Comprobar que esté autenticado correctamente
- Contactar soporte si persiste

#### **"Error al subir documento"**
- Verificar que el archivo no exceda 10 MB
- Comprobar formato de archivo soportado
- Intentar con otro archivo para aislar el problema

#### **"Documento no se puede descargar"**
- El enlace puede haber expirado (duran 1 hora)
- Generar nuevo enlace de descarga
- Verificar permisos de acceso

#### **"Búsqueda no devuelve resultados"**
- Revisar términos de búsqueda por errores tipográficos
- Intentar búsqueda más amplia (menos específica)
- Verificar filtros aplicados

### Contacto de Soporte
- **Email técnico**: soporte@pampaservers.com
- **Horarios de atención**: Lunes a Viernes, 9:00 - 18:00
- **Tiempo de respuesta**: Máximo 24 horas hábiles

---

## 📚 **Mejores Prácticas**

### Organización de Documentos
1. **Nombrar archivos descriptivamente**: Incluir fecha y tipo de estudio
2. **Usar tipos correctos**: Seleccionar la categoría apropiada para cada documento
3. **Añadir descripciones**: Facilita búsquedas futuras
4. **Subir regularmente**: No acumular documentos para subir en lote

### Gestión de Pacientes
1. **Mantener datos actualizados**: Verificar información de contacto
2. **Registrar visitas**: Actualizar fecha de última visita
3. **Documentar diagnósticos**: Usar el campo de notas médicas
4. **Seguir protocolos**: Respetar procedimientos de la clínica

### Seguridad Operacional
1. **Cerrar sesión**: Al finalizar el trabajo
2. **No compartir credenciales**: Cada profesional debe tener su propio acceso
3. **Verificar paciente**: Antes de acceder a historiales
4. **Reportar incidentes**: Comunicar problemas de seguridad inmediatamente

---

## 🔄 **Actualizaciones del Sistema**

### Versión Actual: 2.0
- ✅ Integración con MinIO para almacenamiento en la nube
- ✅ Búsqueda avanzada multi-criterio
- ✅ Migración automática de documentos locales
- ✅ Panel de estadísticas en tiempo real
- ✅ URLs de descarga seguras con expiración

### Próximas Características
- 🔄 Visualizador de documentos integrado
- 🔄 Firma digital de documentos
- 🔄 Sincronización móvil
- 🔄 Recordatorios automáticos
- 🔄 Integración con sistemas externos

### Historial de Cambios
- **v2.0** (Actual): Migración a MinIO y búsqueda avanzada
- **v1.5**: Gestión de profesionales mejorada
- **v1.0**: Versión inicial del sistema

---

## 📞 **Soporte y Contacto**

### Canales de Comunicación
- **Soporte Técnico**: soporte@pampaservers.com
- **Documentación**: Esta guía y documentación API
- **Actualizaciones**: Notificaciones dentro del sistema

### Horarios de Atención
- **Lunes a Viernes**: 9:00 - 18:00 (GMT-3)
- **Soporte de emergencia**: 24/7 para incidentes críticos
- **Mantenimiento programado**: Sábados 2:00 - 4:00 AM

### Escalación de Problemas
1. **Nivel 1**: Problemas de usuario - Soporte técnico
2. **Nivel 2**: Problemas de sistema - Equipo de desarrollo
3. **Nivel 3**: Problemas críticos - Arquitecto de sistemas

---

## ✅ **Lista de Verificación Post-Implementación**

### Para Administradores
- [ ] Verificar que todos los profesionales pueden acceder
- [ ] Confirmar migración exitosa de documentos existentes
- [ ] Probar funciones de búsqueda y filtrado
- [ ] Revisar estadísticas de uso del sistema
- [ ] Configurar permisos de acceso apropiados

### Para Profesionales
- [ ] Familiarizarse con la nueva interfaz
- [ ] Probar subida y descarga de documentos
- [ ] Verificar acceso a historiales de pacientes
- [ ] Confirmar que las búsquedas funcionan correctamente
- [ ] Reportar cualquier problema o sugerencia

---

**Fecha de actualización**: Agosto 2025  
**Versión del documento**: 1.0  
**Próxima revisión**: Septiembre 2025