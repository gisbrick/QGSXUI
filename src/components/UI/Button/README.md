# Button Component

Un componente de botón simple que soporta texto e iconos.

## Uso

```jsx
import { Button } from '../UI';

// Botón básico
<Button>Click me</Button>

// Con icono
<Button icon="⭐">Favorite</Button>

// Solo icono
<Button icon="❤️" />

// Deshabilitado
<Button disabled>Disabled</Button>
```

## Props

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Texto del botón |
| `onClick` | `function` | - | Función al hacer clic |
| `type` | `string` | `'button'` | Tipo de botón HTML |
| `disabled` | `boolean` | `false` | Si está deshabilitado |
| `icon` | `ReactNode` | - | Icono a mostrar |
| `className` | `string` | `''` | Clases CSS adicionales |
