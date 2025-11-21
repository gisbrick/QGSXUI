# Logs Detallados del Flujo de Guardado

## Emojis Utilizados para Identificación Rápida

- 🎨 **MapToolbar** - Operaciones en el toolbar del mapa
- 📝 **Diálogo de Atributos** - Apertura y gestión del diálogo
- 📊 **Estado del Formulario** - Cambios en valores, isDirty, canSave
- 🆕 **INSERT** - Operaciones de inserción de features
- ✏️ **UPDATE** - Operaciones de actualización de features
- 🔍 **Verificación** - Verificaciones de estado y condiciones
- 🔄 **Reset/Actualización** - Reset de formulario y actualización de feature
- ✅ **Éxito** - Operaciones completadas exitosamente
- ❌ **Error** - Errores y problemas
- ⚠️ **Advertencia** - Advertencias
- 🔒 **Bloqueo** - Bloqueo de botones o acciones
- 💾 **canSave** - Estado del botón de guardar

## Flujo Esperado y Logs Correspondientes

### 1. Usuario dibuja geometría y guarda
**Logs esperados:**
```
🎨 [MapToolbar] handleSaveDrawing - INICIO
🎨 [MapToolbar] handleSaveDrawing - Geometría obtenida
🎨 [MapToolbar] handleSaveDrawing - Capas disponibles
📝 [MapToolbar] openAttributesDialog - INICIO
📝 [MapToolbar] openAttributesDialog - Creando feature temporal
📝 [MapToolbar] openAttributesDialog - Diálogo de atributos abierto
```

### 2. Se abre el diálogo de atributos
**Logs esperados:**
```
📋 [FormProvider] Inicializando valores
🔍 [useFormFeature] useEffect - Verificando ID de feature
🆕 [useFormFeature] useEffect - Feature tiene ID temporal, modo INSERT
💾 [FormProvider] canSave calculado (debería ser true si es válido)
```

### 3. Usuario guarda por primera vez (INSERT)
**Logs esperados:**
```
[FeatureAttributesDialog] handleSubmit - INICIO
[useFormActions] defaultSave - LLAMADO
[useFormActions] defaultSave - Validando campos...
🆕 [useFormActions] defaultSave - INSERT mode (sin servicio)
🆕 [useFormActions] defaultSave - Llamando insertFeatureWithGeometry
✅ [useFormActions] defaultSave - INSERT result (sin servicio)
🔄 [useFormActions] defaultSave - Creando nueva feature con ID
🔄 [useFormActions] defaultSave - Llamando resetForm
📊 [useFormState] resetForm - Formulario reseteado (isDirty: false)
✅ [useFormActions] defaultSave - Feature actualizada, debería cambiar a modo UPDATE
✏️ [useFormFeature] useEffect - Feature tiene ID real, cambiando a modo UPDATE
💾 [FormProvider] canSave calculado (debería ser false porque isDirty es false)
✅ [FeatureAttributesDialog] handleSubmit - handleSave completado
🔒 [FeatureAttributesDialog] handleSubmit - Botón de guardar bloqueado
```

### 4. Usuario modifica un atributo
**Logs esperados:**
```
📊 [useFormState] setValue - Campo modificado
📊 [useFormState] setValue - Marcando como dirty
📊 [FeatureAttributesDialog] FormActionsComponent - isDirty cambió
💾 [FormProvider] canSave calculado (debería ser true porque isDirty es true)
```

### 5. Usuario guarda cambios (UPDATE)
**Logs esperados:**
```
[FeatureAttributesDialog] handleSubmit - INICIO
[useFormActions] defaultSave - LLAMADO
✏️ [useFormActions] defaultSave - UPDATE mode (sin servicio)
✏️ [useFormActions] defaultSave - Llamando updateFeature (solo atributos)
✅ [useFormActions] defaultSave - UPDATE result (sin servicio)
✏️ [useFormActions] defaultSave - Llamando resetForm después de UPDATE
📊 [useFormState] resetForm - Formulario reseteado (isDirty: false)
✅ [useFormActions] defaultSave - UPDATE completado, formulario reseteado
💾 [FormProvider] canSave calculado (debería ser false porque isDirty es false)
✅ [FeatureAttributesDialog] handleSubmit - handleSave completado
🔒 [FeatureAttributesDialog] handleSubmit - Botón de guardar bloqueado
```

## Puntos Críticos a Verificar

### 1. Después del INSERT exitoso
- ✅ ¿Se crea la nueva feature con ID real?
- ✅ ¿Se llama a `setFeature(newFeature)`?
- ✅ ¿Se llama a `resetForm(dataToSave)`?
- ✅ ¿Cambia `isNewFeature` a `false`?
- ✅ ¿Cambia `isDirty` a `false`?
- ✅ ¿Cambia `canSave` a `false`?

### 2. Cuando se modifica un atributo
- ✅ ¿Se llama a `setValue`?
- ✅ ¿Cambia `isDirty` a `true`?
- ✅ ¿Cambia `canSave` a `true`?

### 3. En el UPDATE
- ✅ ¿Se detecta que `isNewFeature` es `false`?
- ✅ ¿Se llama a `updateFeature` (no `insertFeatureWithGeometry`)?
- ✅ ¿Se envía solo atributos (sin geometría)?
- ✅ ¿Se llama a `resetForm` después del UPDATE?
- ✅ ¿Cambia `isDirty` a `false`?
- ✅ ¿Cambia `canSave` a `false`?

## Cómo Usar los Logs

1. Abre la consola del navegador (F12)
2. Filtra por los emojis para encontrar rápidamente los logs relevantes
3. Busca las secuencias esperadas arriba
4. Si alguna secuencia no aparece o está en orden incorrecto, ese es el punto donde se rompe el flujo
5. Comparte los logs completos para identificar el problema exacto

## Notas

- Todos los logs incluyen `timestamp` para ver el orden exacto de ejecución
- Los logs muestran el estado antes y después de cada operación crítica
- Los emojis facilitan la identificación visual en la consola

