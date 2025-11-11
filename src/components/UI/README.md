# QGSXUI - Sistema de Componentes UI

Un sistema completo de componentes UI para aplicaciones React con diseño corporativo consistente.

## 🚀 Características

- **18 Componentes UI** completos y optimizados
- **Sistema de diseño corporativo** centralizado
- **Accesibilidad completa** (ARIA, navegación por teclado)
- **Hooks personalizados** para lógica reutilizable
- **Utilidades comunes** para desarrollo eficiente
- **Optimización de rendimiento** con React.memo y callbacks
- **Animaciones fluidas** con CSS
- **Tema oscuro** automático
- **Diseño responsive** para todos los dispositivos

## 📦 Componentes Disponibles

### Navegación y Estructura
- **Accordion** - Contenido plegable con animaciones
- **Breadcrumbs** - Navegación jerárquica
- **Tabs** - Pestañas con orientación horizontal/vertical
- **TreeView** - Vista de árbol con navegación por teclado
- **SidePanel** - Panel lateral deslizante
- **Drawer** - Cajón lateral

### Diálogos y Modales
- **Modal** - Modal con múltiples tamaños
- **ConfirmDialog** - Diálogo de confirmación con variantes
- **ContextMenu** - Menú contextual
- **Tooltip** - Información emergente inteligente

### Feedback y Notificaciones
- **Message** - Mensajes inline con tipos
- **Toast** - Notificaciones temporales
- **NotificationCenter** - Centro de notificaciones completo
- **Spinner** - Indicadores de carga con variantes

### Utilidades y Datos
- **Pagination** - Paginación accesible
- **SkeletonLoader** - Carga esquelética
- **SplitPane** - Paneles redimensionables
- **ErrorBoundary** - Manejo de errores React

## 🎨 Sistema de Diseño

### Variables CSS Disponibles

```css
/* Colores principales */
--color-primary: #1976d2;
--color-secondary: #388e3c;
--color-success: #4caf50;
--color-warning: #ff9800;
--color-error: #f44336;

/* Espaciado */
--spacing-xs: 0.25rem;
--spacing-sm: 0.5rem;
--spacing-md: 0.75rem;
--spacing-lg: 1rem;
--spacing-xl: 1.5rem;

/* Tipografía */
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
```

### Clases Utilitarias

```css
.ui-button        /* Botón base */
.ui-input         /* Input base */
.ui-card          /* Tarjeta base */
.ui-text-primary  /* Texto primario */
.ui-p-md          /* Padding medio */
.ui-m-lg          /* Margen grande */
```

## 🔧 Hooks Personalizados

```javascript
import { 
  useDebounce, 
  useClickOutside, 
  useToggle, 
  useLoading,
  useLocalStorage 
} from '@/components/UI';

// Debounce
const debouncedValue = useDebounce(searchTerm, 300);

// Click fuera
useClickOutside(ref, () => setIsOpen(false));

// Toggle
const [isOpen, toggle] = useToggle(false);

// Loading
const { isLoading, startLoading, stopLoading } = useLoading();

// LocalStorage
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

## 🛠️ Utilidades

```javascript
import { 
  classNames, 
  formatNumber, 
  copyToClipboard, 
  formatRelativeTime 
} from '@/components/UI';

// Combinar clases CSS
const className = classNames('base-class', {
  'active': isActive,
  'disabled': isDisabled
});

// Formatear números
const formatted = formatNumber(1500); // "1.5K"

// Copiar al portapapeles
await copyToClipboard('Texto a copiar');

// Tiempo relativo
const timeAgo = formatRelativeTime(new Date()); // "hace 2 horas"
```

## 📱 Uso Básico

```jsx
import { 
  Modal, 
  Button, 
  Toast, 
  NotificationCenter,
  useToggle 
} from '@/components/UI';

function MyComponent() {
  const [isModalOpen, toggleModal] = useToggle(false);

  return (
    <div>
      <button onClick={toggleModal}>Abrir Modal</button>
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={toggleModal}
        title="Mi Modal"
        size="large"
      >
        <p>Contenido del modal</p>
      </Modal>
      
      <NotificationCenter 
        position="top-right"
        maxNotifications={5}
      />
    </div>
  );
}
```

## 🎯 Ejemplos Avanzados

### NotificationCenter Global

```javascript
// Desde cualquier parte de la aplicación
window.NotificationCenter.addSuccess('¡Guardado exitosamente!');
window.NotificationCenter.addError('Error al procesar');
window.NotificationCenter.addWarning('Advertencia importante');
```

### SplitPane Redimensionable

```jsx
<SplitPane 
  direction="horizontal" 
  initialSize="30%" 
  minSize={200}
  onResize={(size) => console.log('Nuevo tamaño:', size)}
>
  <div>Panel izquierdo</div>
  <div>Panel derecho</div>
</SplitPane>
```

### TreeView con Datos

```jsx
const treeData = [
  {
    id: '1',
    label: 'Carpeta 1',
    icon: '📁',
    children: [
      { id: '1-1', label: 'Archivo 1.txt', icon: '📄' },
      { id: '1-2', label: 'Archivo 2.txt', icon: '📄' }
    ]
  }
];

<TreeView 
  data={treeData}
  onSelect={(node) => console.log('Seleccionado:', node)}
  defaultExpandedNodes={['1']}
/>
```

## 🌙 Tema Oscuro

El sistema incluye soporte automático para tema oscuro:

```css
@media (prefers-color-scheme: dark) {
  .ui-theme-auto {
    --color-background: #121212;
    --color-text-primary: #ffffff;
    /* ... más variables */
  }
}
```

## 📖 Storybook

Todos los componentes incluyen historias de Storybook completas:

```bash
npm run storybook
```

## 🚀 Optimizaciones Implementadas

- **React.memo** en componentes que lo necesitan
- **useCallback** y **useMemo** para optimizar re-renders
- **Lazy loading** de contenido pesado
- **Event delegation** para mejor rendimiento
- **CSS animations** en lugar de JavaScript
- **Debounce/throttle** en eventos frecuentes
- **Portal rendering** para modales y tooltips

## 🔍 Accesibilidad

- **ARIA labels** y roles completos
- **Navegación por teclado** en todos los componentes
- **Focus management** apropiado
- **Screen reader** compatible
- **Color contrast** WCAG AA compatible
- **Reduced motion** respetado

## 🤝 Contribuciones

Para agregar nuevos componentes:

1. Crear carpeta en `/src/components/UI/`
2. Incluir `.jsx`, `.css`, y `.stories.jsx`
3. Usar el sistema de diseño corporativo
4. Agregar tests de accesibilidad
5. Documentar props y ejemplos
6. Exportar en `index.js`

## 📄 Licencia

MIT - Ver archivo LICENSE para más detalles.
