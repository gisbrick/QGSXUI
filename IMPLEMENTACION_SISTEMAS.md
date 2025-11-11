# Implementación de Sistemas de Personalización - QGSXUI

Este documento explica cómo se han implementado los dos sistemas principales de personalización en QGSXUI.

## 🎯 Sistemas Implementados

### 1. Sistema de Action Handlers (Acciones Personalizables)
### 2. Sistema de Temas (Estilos Personalizables)

---

## 1️⃣ Sistema de Action Handlers

### 📍 Ubicación
- **Contexto**: `src/contexts/ActionHandlersContext.jsx`
- **Documentación**: `src/contexts/ActionHandlersContext.md`

### ✅ Estado de Implementación

#### Completado:
- ✅ Contexto y Provider creados
- ✅ Hook `useActionHandlers` implementado
- ✅ Integrado en `FormProvider` y `Form`
- ✅ Handlers disponibles: `onSave`, `onCancel`, `onDelete`, `onFieldChange`

#### Pendiente:
- ⏳ Integración en componente `Table`
- ⏳ Integración en componente `Map`

### 🚀 Uso Rápido

```jsx
import { ActionHandlersProvider } from './contexts/ActionHandlersContext';

function App() {
  const handlers = {
    form: {
      onSave: async (data, context) => {
        // Tu lógica personalizada
        return await customSave(data);
      }
    }
  };

  return (
    <ActionHandlersProvider handlers={handlers}>
      <QgisConfigProvider {...config}>
        <Form layerName="mi_capa" />
      </QgisConfigProvider>
    </ActionHandlersProvider>
  );
}
```

---

## 2️⃣ Sistema de Temas

### 📍 Ubicación
- **Tema base**: `src/themes/theme.css`
- **Ejemplo**: `src/themes/ejemplo-cliente/theme.css`
- **Documentación**: `src/themes/README.md`

### ✅ Estado de Implementación

#### Completado:
- ✅ Variables CSS base definidas
- ✅ Sistema de temas por cliente/rama
- ✅ Integrado en Storybook
- ✅ Estilos de Form usando variables CSS
- ✅ Ejemplo de tema personalizado

#### Pendiente:
- ⏳ Migrar más componentes a usar variables CSS
- ⏳ Crear temas para clientes específicos

### 🚀 Uso Rápido

#### Crear un tema personalizado:

1. **Crear archivo de tema**:
```css
/* src/themes/mi-cliente/theme.css */
:root {
  --color-primary: #1a5490;
  --font-family-base: "Roboto", sans-serif;
}
```

2. **Importar en la aplicación**:
```jsx
// main.tsx
import './themes/mi-cliente/theme.css';
```

---

## 📋 Checklist de Integración

### Para Action Handlers:

- [x] Form - `onSave`, `onCancel`, `onDelete`
- [ ] Table - `onRowClick`, `onRowEdit`, `onRowDelete`
- [ ] Map - `onFeatureClick`, `onMapClick`, `onFeatureSelect`

### Para Temas:

- [x] Variables CSS base definidas
- [x] Form usando variables CSS
- [ ] Table usando variables CSS
- [ ] Map usando variables CSS
- [ ] Componentes UI usando variables CSS

---

## 🔄 Próximos Pasos

### Corto Plazo:
1. Integrar Action Handlers en `Table` y `Map`
2. Migrar estilos de `Table` y `Map` a variables CSS
3. Crear ejemplos de uso en Storybook

### Medio Plazo:
1. Migrar todos los componentes UI a variables CSS
2. Crear temas para clientes reales
3. Documentar mejores prácticas

### Largo Plazo:
1. Sistema de selección de temas en runtime
2. Editor visual de temas
3. Exportación/importación de temas

---

## 📚 Documentación

- **Action Handlers**: Ver `src/contexts/ActionHandlersContext.md`
- **Temas**: Ver `src/themes/README.md`
- **Ejemplos**: Ver `src/themes/ejemplo-cliente/theme.css`

---

## 💡 Ejemplos Completos

### Ejemplo 1: Personalizar guardado de formulario

```jsx
<ActionHandlersProvider handlers={{
  form: {
    onSave: async (data, context) => {
      // Validación personalizada
      if (!data.campo_requerido) {
        throw new Error('Campo requerido');
      }
      
      // Llamada a API personalizada
      const response = await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      return await response.json();
    }
  }
}}>
  <Form layerName="mi_capa" />
</ActionHandlersProvider>
```

### Ejemplo 2: Tema corporativo

```css
/* src/themes/empresa-abc/theme.css */
:root {
  --color-primary: #1a5490;
  --color-secondary: #2d8659;
  --font-family-base: "Roboto", sans-serif;
  --border-radius-md: 0.75rem;
}
```

```jsx
// main.tsx
import './themes/empresa-abc/theme.css';
```

---

## 🎨 Estructura de Archivos

```
src/
├── contexts/
│   └── ActionHandlersContext.jsx      # Sistema de handlers
│   └── ActionHandlersContext.md       # Documentación
├── themes/
│   ├── theme.css                      # Variables base
│   ├── README.md                      # Documentación
│   └── ejemplo-cliente/
│       └── theme.css                  # Ejemplo de tema
└── components/
    └── QGS/
        └── Form/
            ├── Form.jsx               # Usa handlers
            └── Form.css               # Usa variables CSS
```

---

## ✅ Estado General

**Sistema de Action Handlers**: ✅ Funcional (parcialmente integrado)
**Sistema de Temas**: ✅ Funcional (base completa, migración en progreso)

Ambos sistemas están listos para usar y pueden extenderse según las necesidades de cada cliente/organización.

