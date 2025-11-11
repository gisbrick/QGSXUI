# Sistema de Temas - QGSXUI

Este sistema permite personalizar fácilmente los estilos de los componentes para adaptarlos a las necesidades de cada cliente u organización.

## 📁 Estructura de Temas

```
src/themes/
├── theme.css              # Variables CSS base (tema por defecto)
├── README.md             # Esta documentación
└── [nombre-cliente]/     # Temas personalizados por cliente
    └── theme.css         # Variables CSS sobrescritas
```

## 🎨 Crear un Tema Personalizado

### Opción 1: Tema por Cliente/Organización

1. **Crea una carpeta** con el nombre del cliente/organización:
   ```
   src/themes/empresa-abc/theme.css
   ```

2. **Sobrescribe las variables** que necesites:
   ```css
   :root {
     /* Colores corporativos */
     --color-primary: #1a5490;
     --color-primary-dark: #0f3a5f;
     --color-primary-light: #4a7ba7;
     
     /* Tipografía corporativa */
     --font-family-base: "Roboto", sans-serif;
     --font-family-heading: "Roboto Condensed", sans-serif;
     
     /* Espaciado personalizado */
     --spacing-lg: 1.25rem;
   }
   ```

3. **Importa el tema** en tu aplicación:
   ```jsx
   // En main.tsx o App.tsx
   import './themes/empresa-abc/theme.css';
   ```

### Opción 2: Tema por Rama GIT

Para mantener temas separados por rama GIT:

1. **Crea una rama** específica para el cliente:
   ```bash
   git checkout -b cliente-empresa-abc
   ```

2. **Crea el tema** en esa rama:
   ```
   src/themes/empresa-abc/theme.css
   ```

3. **Mantén los cambios** solo en esa rama, haciendo merge periódico desde `main` para obtener actualizaciones.

## 📝 Variables Disponibles

### Colores
- `--color-primary`, `--color-primary-light`, `--color-primary-dark`
- `--color-secondary`, `--color-success`, `--color-warning`, `--color-error`
- `--color-background`, `--color-text-primary`, `--color-border`

### Tipografía
- `--font-family-base`, `--font-family-heading`
- `--font-size-*`, `--font-weight-*`, `--line-height-*`

### Espaciado
- `--spacing-xs` hasta `--spacing-xxxl`

### Componentes Específicos
- `--map-control-*`, `--form-field-*`, `--table-*`, `--toolbar-*`

Ver `theme.css` para la lista completa de variables.

## 🔧 Uso en Componentes

Los componentes ya usan estas variables automáticamente:

```css
/* En un componente */
.my-component {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-md);
}
```

## 🎯 Ejemplo Completo

### Tema para "Empresa ABC"

**src/themes/empresa-abc/theme.css:**
```css
:root {
  /* Colores corporativos */
  --color-primary: #1a5490;
  --color-primary-dark: #0f3a5f;
  --color-primary-light: #4a7ba7;
  
  /* Tipografía */
  --font-family-base: "Roboto", "Helvetica Neue", sans-serif;
  --font-size-base: 15px;
  
  /* Bordes más redondeados */
  --border-radius-md: 0.75rem;
  --border-radius-lg: 1rem;
  
  /* Sombras más suaves */
  --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.08);
}
```

**main.tsx:**
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './themes/empresa-abc/theme.css'; // Importar tema personalizado
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## 🔄 Migración de Estilos Existentes

Si tienes estilos hardcodeados, migra a variables:

**Antes:**
```css
.button {
  background-color: #1976d2;
  padding: 16px;
  border-radius: 8px;
}
```

**Después:**
```css
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
}
```

## 📚 Mejores Prácticas

1. **Solo sobrescribe lo necesario**: No copies todo el archivo base, solo las variables que cambian
2. **Usa nombres descriptivos**: `empresa-abc` en lugar de `cliente1`
3. **Documenta cambios importantes**: Añade comentarios explicando por qué se cambió algo
4. **Mantén consistencia**: Usa las mismas variables en todos los componentes
5. **Prueba en Storybook**: Verifica que los cambios se vean bien en todos los componentes

## 🚀 Integración con Storybook

Para ver diferentes temas en Storybook, puedes crear decoradores:

```jsx
// .storybook/preview.ts
import '../src/themes/empresa-abc/theme.css'; // Tema por defecto en Storybook
```

O crear un selector de temas en Storybook para probar diferentes variantes.

