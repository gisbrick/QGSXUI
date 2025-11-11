# Implementación del BaseControl - Componente Envoltorio para Controles

## Resumen

Se ha implementado un sistema completo de componentes de control con un wrapper común llamado `BaseControl` que proporciona funcionalidades avanzadas para todos los controles del formulario.

## Arquitectura Implementada

### BaseControl
Componente envoltorio que proporciona funcionalidades comunes:

- **Gestión de etiquetas**: Alias personalizable con posicionamiento flexible (arriba o a la izquierda)
- **Manejo de valores**: Get/Set con soporte para valores predeterminados
- **Valores predeterminados**: Soporte para valores fijos y expresiones (estructura preparada)
- **Reaplica predeterminados**: Opción para recargar valores predeterminados en actualizaciones
- **Reutilización de valores**: Memoria del último valor introducido
- **Sistema de validación**: Restricciones configurables con mensajes de error

### Controles Refactorizados

Todos los controles han sido refactorizados para usar el BaseControl:

1. **CheckboxControl**: Control booleano con wrapper BaseControl
2. **TextControl**: Control de texto con tipos múltiples (text, email, password, etc.)
3. **ValueMapControl**: Control de selección con opciones configurables
4. **NumberControl**: Control numérico con validación de rangos (nuevo)
5. **DateControl**: Control de fecha/hora con tipos múltiples (nuevo)

## Funcionalidades Implementadas

### 1. Alias de Etiqueta
```jsx
<TextControl 
  alias="Nombre del campo"
  labelAbove={true} // o false para mostrar a la izquierda
/>
```

### 2. Valores Predeterminados
```jsx
<TextControl 
  defaultValue="Valor inicial"
  defaultExpression="expression_placeholder" // Para futuras implementaciones
/>
```

### 3. Reapplicación de Valores Predeterminados
```jsx
<TextControl 
  defaultValue="Valor inicial"
  reapplyDefaultOnUpdate={true}
  featureUpdateTrigger={triggerValue} // Se actualiza cuando cambia
/>
```

### 4. Reutilización de Último Valor
```jsx
<TextControl 
  reuseLastValue={true} // Recuerda el último valor introducido
/>
```

### 5. Sistema de Restricciones
```jsx
<TextControl 
  constraints={{
    notNull: true,        // Campo obligatorio
    unique: true,         // Valor único (estructura preparada)
    expression: "expr"    // Validación por expresión (estructura preparada)
  }}
/>
```

## Estructura de Archivos

```
src/components/controls/
├── BaseControl/
│   ├── BaseControl.jsx          # Componente principal
│   ├── BaseControl.css          # Estilos del wrapper
│   ├── BaseControl.stories.jsx  # Documentación Storybook
│   └── index.js                 # Exportaciones
├── CheckboxControl/
│   ├── CheckboxControl.jsx      # Refactorizado con BaseControl
│   └── CheckboxControl.stories.jsx # Actualizado con nuevas funcionalidades
├── TextControl/
│   └── TextControl.jsx          # Refactorizado con BaseControl
├── ValueMapControl/
│   └── ValueMapControl.jsx      # Refactorizado con BaseControl
├── NumberControl/               # Nuevo
│   ├── NumberControl.jsx
│   └── index.js
└── DateControl/                 # Nuevo
    ├── DateControl.jsx
    └── index.js
```

## Internacionalización

Se han añadido nuevas claves de traducción:

### Español (src/locales/es/translation.json)
```json
{
  "ui": {
    "validation": {
      "required": "Este campo es obligatorio",
      "unique": "El valor debe ser único",
      "invalid": "Valor inválido"
    }
  }
}
```

### Inglés (src/locales/en/translation.json)
```json
{
  "ui": {
    "validation": {
      "required": "This field is required",
      "unique": "Value must be unique",
      "invalid": "Invalid value"
    }
  }
}
```

## Funcionalidades Preparadas para Implementación Futura

### 1. Evaluación de Expresiones
- Estructura preparada en `evaluateDefaultValue()`
- Placeholder para `defaultExpression`
- Estructura preparada en validación por expresión

### 2. Validación de Unicidad
- Estructura preparada en `validateConstraints()`
- Placeholder para verificación de unicidad

### 3. Trigger de Actualizaciones
- Sistema de triggers implementado
- Reacciona a cambios en features/geometrías

## Estilos y Diseño

- **Responsive**: Adapta el layout en dispositivos móviles
- **Modo oscuro**: Soporte para tema oscuro
- **Animaciones**: Transiciones suaves para mensajes de validación
- **Accesibilidad**: Etiquetas ARIA y navegación por teclado

## Casos de Uso Demostrados en Storybook

1. **Campos básicos**: Controles simples con etiquetas
2. **Campos obligatorios**: Validación de campos requeridos
3. **Valores predeterminados**: Campos con valores iniciales
4. **Reapplicación**: Campos que se resetean en actualizaciones
5. **Memoria de valores**: Campos que recuerdan el último valor
6. **Layout flexible**: Etiquetas arriba vs. a la izquierda

## Próximos Pasos

1. **Implementar evaluación de expresiones**: Sistema para evaluar expresiones dinámicas
2. **Implementar validación de unicidad**: Sistema para verificar valores únicos
3. **Integrar con features de QGIS**: Conectar con los datos de features y geometrías
4. **Añadir más tipos de control**: Range, color, file, etc.
5. **Optimizar rendimiento**: Memoización y lazy loading si es necesario

## Compatibilidad

- ✅ Todos los controles existentes siguen funcionando
- ✅ API retrocompatible
- ✅ Nuevas funcionalidades son opcionales
- ✅ Storybook actualizado con ejemplos
- ✅ Build exitoso sin errores
- ✅ Traducciones multiidioma funcionando
