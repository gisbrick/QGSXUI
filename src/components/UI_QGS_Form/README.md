# UI_QGS_Form Components

Esta carpeta contiene los componentes de formulario específicos para QGS (anteriormente llamada controls).

## Componentes incluidos:

- **BaseControl** - Control base para todos los elementos de formulario
- **TextControl** - Input de texto
- **NumberControl** - Input numérico
- **DateControl** - Selector de fecha
- **CheckboxControl** - Checkbox
- **ValueMapControl** - Select dropdown

## Características

Todos los componentes han sido simplificados a su funcionalidad mínima:
- Props esenciales solamente
- Estilos minimalistas
- Stories de Storybook básicas
- Estados: normal, error, disabled

## Uso

```jsx
import { TextControl, CheckboxControl } from './components/UI_QGS_Form';

<TextControl 
  label="Name" 
  value={name} 
  onChange={setName} 
/>
```

## Nota
Esta carpeta fue renombrada de `controls` a `UI_QGS_Form` para una mejor organización y claridad en la estructura del proyecto.
