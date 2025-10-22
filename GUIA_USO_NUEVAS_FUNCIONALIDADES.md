# 📖 Guía de Uso - Nuevas Funcionalidades

## 🎯 Funcionalidad 1: Edición Rápida de Puntos

### ¿Cómo acceder?
1. Abre el detalle de un curso
2. **Haz clic directamente en el número de puntos** en la tabla
   - E1-PG, E1-PI, E2-PG, E2-PI, EF-PG, EF-PI

### ¿Qué ves?
Un modal con dos campos:
- **PG (Puntos Grupal)**: 0-100
- **PI (Puntos Individual)**: 0-100

### ¿Qué sucede?
- Los puntos se guardan automáticamente
- La sumatoria (PG + PI) se calcula automáticamente
- Aparece un mensaje de confirmación

### Ejemplo
```
Usuario: Hago clic en "85" (E1-PG de Juan)
         ↓
App:     Abre modal "Editar E1 - Juan Pérez"
         ↓
Usuario: Cambio a 90 y hago clic Guardar
         ↓
App:     Guarda 90, calcula sumatoria = 90 + PI, cierra modal
         ↓
Usuario: Ve el cambio reflejado en la tabla
```

---

## 🎯 Funcionalidad 2: Menú Contextual

### ¿Cómo acceder?
**Opción 1 - Escritorio**: Clic derecho en la fila del estudiante  
**Opción 2 - Móvil**: Mantén presionado (longpress) la fila

### ¿Qué opciones tienes?
1. **✏️ Editar E1** - Abre editor de E1
2. **✏️ Editar E2** - Abre editor de E2
3. **✏️ Editar EF** - Abre editor de EF
4. **🗑️ Eliminar estudiante** - Confirma y elimina
5. **❌ Cancelar** - Cierra el menú

### Ejemplo de Flujo
```
Usuario: Clic derecho en Juan Pérez
         ↓
App:     Muestra menú con opciones
         ↓
Usuario: Selecciona "Editar E2"
         ↓
App:     Abre editor de puntos para E2
         ↓
Usuario: Ingresa valores y guarda
         ↓
App:     Tabla actualizada
```

---

## 🎯 Funcionalidad 3: Eliminar Estudiante

### ¿Cómo hacerlo?
1. Abre el menú contextual (clic derecho o longpress)
2. Selecciona **"Eliminar estudiante"**
3. **Confirma en el diálogo** que aparece (botón rojo)

### ⚠️ Importante
- Esta acción **NO se puede deshacer**
- Se elimina del curso pero los datos se guardan en BD
- Puedes reimportar un curso con el estudiante si es necesario

### Ejemplo
```
┌─────────────────────────────────┐
│ ⚠️ Confirmar eliminación         │
├─────────────────────────────────┤
│ ¿Está seguro de eliminar a       │
│ Juan Pérez de este curso?        │
├─────────────────────────────────┤
│ [Cancelar]    [🗑️ Eliminar]     │
└─────────────────────────────────┘
```

---

## 📋 Casos de Uso

### Caso 1: Corregir un Error de Puntuación
```
1. Ves que Juan tiene 50 en E1-PG pero debería ser 85
2. Haces clic en el 50
3. Cambias a 85 y guardas
✅ ¡Listo! La tabla se actualiza automáticamente
```

### Caso 2: Editar Múltiples Entregas de un Estudiante
```
1. Clic derecho en María
2. Selecciona "Editar E1" → ingresa puntos → guarda
3. Clic derecho en María nuevamente
4. Selecciona "Editar E2" → ingresa puntos → guarda
5. Clic derecho en María nuevamente
6. Selecciona "Editar EF" → ingresa puntos → guarda
✅ Tres entregas editadas rápidamente
```

### Caso 3: Eliminar un Estudiante Duplicado
```
1. Ves que "Juan Pérez" aparece dos veces
2. Clic derecho en la fila duplicada
3. Selecciona "Eliminar estudiante"
4. Confirma en el diálogo
✅ El duplicado desaparece
```

---

## 🔍 Pantalla de Edición de Puntos

```
┌────────────────────────────────────┐
│ Editar E2 - María García López     │
├────────────────────────────────────┤
│                                    │
│ PG (Puntos Grupal)         [75   ] │
│ PI (Puntos Individual)     [   ] │
│                                    │
├────────────────────────────────────┤
│ [Cancelar]            [✓ Guardar] │
└────────────────────────────────────┘

Después de guardar:
┌────────────────────────────────────┐
│ ✅ Puntos de E2 guardados           │
│    correctamente                    │
│                            [×]      │
└────────────────────────────────────┘
```

---

## 🎨 Indicadores Visuales

### Celdas de Puntos
- **Normales**: Texto gris `– –`
- **Hover**: Se resaltan azul y aumentan de tamaño
- **Click**: Se presionan ligeramente

### Avisos del Sistema
- 🟢 **Verde**: Operación exitosa
- 🔴 **Rojo**: Error o eliminación
- 🟡 **Naranja**: Advertencia
- 🔵 **Azul**: Información

---

## 💡 Tips y Trucos

### ⚡ Edición Rápida
```
No necesitas abrir la evaluación completa,
solo haz clic en el número de puntos
```

### 🔒 Seguridad
```
Siempre confirma antes de eliminar un estudiante
(dos clicks para evitar accidentes)
```

### 📱 Móvil vs Escritorio
```
Escritorio: Clic derecho para menú
Móvil:      Longpress (mantener 1 segundo)
```

### 📊 Revisión de Cambios
```
Los cambios se guardan automáticamente
en la base de datos, sin perder datos
```

---

## ❓ Preguntas Frecuentes

### P: ¿Se guardan automáticamente los puntos?
**R**: Sí, cuando haces clic en "Guardar" en el modal, los datos se persisten en la base de datos inmediatamente.

### P: ¿Puedo editar múltiples entregas?
**R**: Sí, usa el menú contextual para acceder a Editar E1, E2 y EF independientemente.

### P: ¿Qué pasa si cierro la app sin guardar?
**R**: Si haces clic en "Guardar" en el modal, los datos se guardan. Si cierras el modal sin guardar (Cancelar), los cambios se descartan.

### P: ¿Se puede recuperar un estudiante eliminado?
**R**: No directamente. Necesitas reimportar el CSV con el estudiante.

### P: ¿Funciona en móvil?
**R**: Sí, usa longpress (mantén presionado) en lugar de clic derecho.

### P: ¿Puedo editar sin abrir la evaluación completa?
**R**: Sí, eso es exactamente la ventaja de la edición inline.

---

## 🔧 Validaciones

### Campos de Puntos
- ✅ Mínimo: 0
- ✅ Máximo: 100
- ✅ Solo números
- ✅ Cálculo automático de sumatoria

### Eliminación
- ✅ Confirmación requerida
- ✅ No se puede deshacer
- ✅ Los datos se guardan en BD

---

## 📞 Soporte

Si algo no funciona como se espera:

1. **Abre la consola del navegador** (F12)
2. **Busca mensajes de error** en la pestaña "Console"
3. **Intenta recargar la página** (Ctrl+R)
4. **Reinicia la app** si los cambios no se reflejan

---

## 🎓 Comparación: Antes vs Después

### ANTES
```
Para editar puntos de Juan en E1:
1. Haz clic en la fila
2. Se abre modal completo de evaluación
3. Busca el criterio correcto
4. Selecciona nivel
5. Repites para cada criterio
6. Guardas la evaluación
⏱️ Tiempo: ~2-3 minutos
```

### DESPUÉS
```
Para editar puntos de Juan en E1:
1. Haz clic en el número de puntos
2. Cambias los valores
3. Guardas
⏱️ Tiempo: ~15 segundos
```

---

**Versión**: 1.0  
**Última actualización**: 22 de octubre de 2025  
**Estado**: 📍 Listo para Producción
