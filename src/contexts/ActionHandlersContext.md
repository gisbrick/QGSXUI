# Sistema de Action Handlers - QGSXUI

Este sistema permite sobrescribir acciones por defecto de los componentes, permitiendo personalizar el comportamiento sin modificar el código fuente de los componentes.

## 🎯 Objetivo

Permitir que cada acción ejecutada en un componente pueda ser capturada y sobrescrita desde el código que integra el componente, facilitando la personalización por cliente/organización.

## 📦 Instalación

El sistema ya está integrado. Solo necesitas usar el `ActionHandlersProvider` en tu aplicación.

## 🚀 Uso Básico

### 1. Envolver tu aplicación con ActionHandlersProvider

```jsx
import { ActionHandlersProvider } from './contexts/ActionHandlersContext';

function App() {
  const customHandlers = {
    form: {
      onSave: async (data, context) => {
        // Tu lógica personalizada para guardar
        console.log('Guardando con lógica personalizada', data);
        
        // Puedes hacer llamadas a APIs personalizadas
        const response = await fetch('/api/custom-save', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        
        return await response.json();
      },
      onCancel: () => {
        // Lógica personalizada para cancelar
        console.log('Cancelando con lógica personalizada');
        // Por ejemplo, mostrar un diálogo de confirmación
      }
    },
    table: {
      onRowClick: (row) => {
        // Lógica personalizada al hacer clic en una fila
        console.log('Fila clickeada:', row);
      },
      onRowEdit: (row) => {
        // Abrir modal personalizado, navegar a otra página, etc.
        window.location.href = `/edit/${row.id}`;
      }
    },
    map: {
      onFeatureClick: (feature) => {
        // Lógica personalizada al hacer clic en una feature del mapa
        console.log('Feature clickeada:', feature);
      }
    }
  };

  return (
    <ActionHandlersProvider handlers={customHandlers}>
      <QgisConfigProvider {...config}>
        {/* Tus componentes */}
      </QgisConfigProvider>
    </ActionHandlersProvider>
  );
}
```

### 2. Usar en componentes

Los componentes ya están preparados para usar los handlers. Ejemplo en un componente:

```jsx
import { useActionHandlers } from '../../contexts/ActionHandlersContext';

function MyForm() {
  const { getHandler } = useActionHandlers();
  
  // Handler por defecto
  const defaultSave = async (data) => {
    // Lógica por defecto
    return await saveToQGIS(data);
  };
  
  // Obtener handler (personalizado o por defecto)
  const handleSave = getHandler('form', 'onSave', defaultSave);
  
  const onSubmit = async (e) => {
    e.preventDefault();
    const formData = getFormData();
    
    // Ejecutar handler (usará el personalizado si existe, sino el por defecto)
    await handleSave(formData, { layerName: 'mi_capa' });
  };
  
  return <form onSubmit={onSubmit}>...</form>;
}
```

## 📋 Handlers Disponibles

### Form (Formularios)

- `onSave(data, context)` - Se ejecuta al guardar un formulario
- `onCancel()` - Se ejecuta al cancelar la edición
- `onDelete(featureId, context)` - Se ejecuta al eliminar una feature
- `onFieldChange(fieldName, value, context)` - Se ejecuta al cambiar un campo
- `onValidation(fieldName, value, rules)` - Se ejecuta durante la validación

### Table (Tablas)

- `onRowClick(row, index)` - Se ejecuta al hacer clic en una fila
- `onRowEdit(row)` - Se ejecuta al editar una fila
- `onRowDelete(row)` - Se ejecuta al eliminar una fila
- `onRowSelect(row, selected)` - Se ejecuta al seleccionar/deseleccionar una fila
- `onPageChange(page, pageSize)` - Se ejecuta al cambiar de página

### Map (Mapas)

- `onFeatureClick(feature, event)` - Se ejecuta al hacer clic en una feature
- `onFeatureSelect(feature)` - Se ejecuta al seleccionar una feature
- `onMapClick(latlng, event)` - Se ejecuta al hacer clic en el mapa
- `onMapMove(bounds, zoom)` - Se ejecuta al mover el mapa
- `onLayerChange(layerName)` - Se ejecuta al cambiar de capa

## 💡 Ejemplos de Uso

### Ejemplo 1: Guardar con validación personalizada

```jsx
const handlers = {
  form: {
    onSave: async (data, context) => {
      // Validación personalizada antes de guardar
      if (data.campo_importante && data.campo_importante.length < 10) {
        throw new Error('El campo importante debe tener al menos 10 caracteres');
      }
      
      // Llamar a API personalizada
      const response = await fetch('/api/save-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Error al guardar');
      }
      
      return await response.json();
    }
  }
};
```

### Ejemplo 2: Navegación personalizada al editar

```jsx
const handlers = {
  table: {
    onRowEdit: (row) => {
      // En lugar de abrir un modal, navegar a otra página
      window.location.href = `/features/${row.id}/edit`;
    }
  }
};
```

### Ejemplo 3: Mostrar información personalizada en el mapa

```jsx
const handlers = {
  map: {
    onFeatureClick: (feature, event) => {
      // Mostrar popup personalizado
      const popup = L.popup()
        .setLatLng(event.latlng)
        .setContent(`
          <h3>${feature.properties.nombre}</h3>
          <p>Información personalizada</p>
          <button onclick="customAction(${feature.id})">Acción personalizada</button>
        `)
        .openOn(map);
    }
  }
};
```

## 🔧 API del Hook

### `useActionHandlers()`

Retorna un objeto con:

- `handlers` - Objeto completo de handlers configurados
- `getHandler(component, action, defaultHandler)` - Obtiene un handler (personalizado o por defecto)
- `executeHandler(component, action, defaultHandler, ...args)` - Ejecuta un handler directamente
- `hasCustomHandler(component, action)` - Verifica si existe un handler personalizado

### Ejemplo de uso avanzado

```jsx
const { getHandler, hasCustomHandler, executeHandler } = useActionHandlers();

// Verificar si hay handler personalizado
if (hasCustomHandler('form', 'onSave')) {
  console.log('Usando handler personalizado');
}

// Ejecutar directamente
await executeHandler(
  'form',
  'onSave',
  defaultSaveHandler,
  formData,
  { layerName: 'mi_capa' }
);
```

## 🎨 Integración con Componentes Existentes

Los componentes QGS (Form, Table, Map) ya están preparados para usar este sistema. Solo necesitas:

1. Envolver tu app con `ActionHandlersProvider`
2. Pasar los handlers personalizados
3. Los componentes usarán automáticamente tus handlers si existen

## 📝 Mejores Prácticas

1. **Siempre proporciona handlers por defecto**: Los componentes deben funcionar sin handlers personalizados
2. **Maneja errores**: Los handlers personalizados deben manejar errores apropiadamente
3. **Mantén la compatibilidad**: Los handlers deben aceptar los mismos parámetros que los por defecto
4. **Documenta cambios**: Si cambias el comportamiento, documenta qué hace tu handler personalizado
5. **Prueba ambos casos**: Prueba con y sin handlers personalizados

## 🔄 Migración de Código Existente

Si tienes componentes que ejecutan acciones directamente, migra a usar handlers:

**Antes:**
```jsx
const handleSave = async () => {
  await saveToQGIS(formData);
};
```

**Después:**
```jsx
const { getHandler } = useActionHandlers();
const defaultSave = async (data) => await saveToQGIS(data);
const handleSave = getHandler('form', 'onSave', defaultSave);
```

