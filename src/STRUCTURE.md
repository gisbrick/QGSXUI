# Estructura del Proyecto QGSXUI

Este documento describe la organización y estructura del proyecto después de la reorganización.

## 📁 Estructura de Directorios

```
src/
├── components/          # Componentes React organizados por propósito
│   ├── QGS/            # Componentes específicos de QGIS
│   │   ├── Form/       # Formularios QGIS
│   │   ├── Map/        # Componentes de mapa
│   │   │   ├── MapTools/  # Herramientas del mapa (zoom, medición, info)
│   │   │   └── ...     # Otros componentes del mapa
│   │   ├── Table/      # Tablas QGIS
│   │   └── ...         # Otros componentes QGS
│   ├── UI/             # Componentes UI genéricos reutilizables
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── ConfirmDialog/
│   │   └── ...         # Otros componentes UI
│   ├── UI_QGS/         # Componentes UI específicos para QGS
│   │   ├── Toolbar/
│   │   ├── Notifications/
│   │   └── ...
│   ├── UI_QGS_Form/    # Controles de formulario para QGS
│   │   ├── BaseControl/
│   │   ├── TextControl/
│   │   └── ...
│   └── controls/       # Controles de formulario genéricos
│
├── hooks/               # Hooks personalizados consolidados
│   ├── useTranslation.js
│   ├── useClickOutside.js
│   ├── useDebounce.js
│   ├── useLoading.js
│   ├── useToggle.js
│   ├── translations.js  # Utilidades de traducción
│   └── index.js         # Exportaciones centralizadas
│
├── services/            # Servicios para comunicación con QGIS Server
│   ├── qgisConfigFetcher.js  # Obtener configuración del proyecto
│   ├── qgisWFSFetcher.js     # Operaciones WFS (GetFeature, Delete, etc.)
│   └── qgisWMSFetcher.js     # Operaciones WMS (GetFeatureInfo, etc.)
│
├── utilities/           # Utilidades y funciones auxiliares
│   ├── mapUtilities.js        # Utilidades para mapas
│   └── formValuesValidators.js # Validadores de formularios
│
├── locales/            # Archivos de traducción
│   ├── es/
│   └── en/
│
└── contexts/           # Contextos React
    └── ActionHandlersContext.jsx
```

## 🎯 Principios de Organización

### 1. Separación por Propósito
- **QGS/**: Componentes específicos de QGIS que dependen de la configuración QGIS
- **UI/**: Componentes genéricos reutilizables sin dependencias QGIS
- **UI_QGS/**: Componentes UI adaptados para uso con QGIS
- **UI_QGS_Form/**: Controles de formulario específicos para QGIS

### 2. Hooks Consolidados
Todos los hooks personalizados están en `src/hooks/`:
- `useTranslation`: Manejo de traducciones
- `useClickOutside`: Detectar clics fuera de elementos
- `useDebounce`: Debounce de valores
- `useLoading`: Manejo de estado de carga
- `useToggle`: Toggle de valores booleanos
- `useLocalStorage`: Persistencia en localStorage
- `translations.js`: Utilidades para cargar traducciones

### 3. Servicios Separados
Los servicios están organizados por protocolo/funcionalidad:
- **qgisConfigFetcher**: Configuración del proyecto
- **qgisWFSFetcher**: Operaciones WFS (GetFeature, Delete, etc.)
- **qgisWMSFetcher**: Operaciones WMS (GetFeatureInfo)

### 4. Utilidades por Dominio
- **mapUtilities**: Funciones relacionadas con mapas
- **formValuesValidators**: Validadores de formularios

## 📦 Imports Recomendados

### Hooks
```javascript
// Desde hooks centralizados
import { useTranslation, useClickOutside, useDebounce } from '../../hooks';
import { loadTranslations } from '../../hooks/translations';
```

### Componentes QGS
```javascript
// Componentes principales
import { Map, MapProvider, useMap } from './components/QGS/Map';
import { Form } from './components/QGS/Form';

// Herramientas del mapa
import { InfoClick, ZoomInBox, MeasureLine } from './components/QGS/Map/MapTools';
```

### Servicios
```javascript
import { fetchFeatureInfo } from './services/qgisWMSFetcher';
import { deleteFeature } from './services/qgisWFSFetcher';
import { fetchQgisConfig } from './services/qgisConfigFetcher';
```

### Utilidades
```javascript
import { setView, getVisibleLayersInChildren } from './utilities/mapUtilities';
import { validateValue } from './utilities/formValuesValidators';
```

## 🔄 Cambios Realizados en la Reorganización

1. **Hooks Consolidados**: Todos los hooks movidos a `src/hooks/`
2. **Traducciones Corregidas**: `utilities/traslations.js` → `hooks/translations.js` (corregido typo)
3. **Archivos de Backup Eliminados**: `MapProvider_backup.jsx` y `MapProvider_simple.jsx`
4. **Exports Limpiados**: `Map/index.js` ahora tiene exports claros y organizados
5. **Imports Actualizados**: Todos los imports de hooks y traducciones actualizados

## 📝 Notas de Mantenimiento

- **Nuevos Hooks**: Añadir en `src/hooks/` y exportar desde `index.js`
- **Nuevos Servicios**: Añadir en `src/services/` siguiendo el patrón `qgis*Fetcher.js`
- **Nuevas Utilidades**: Añadir en `src/utilities/` agrupadas por dominio
- **Nuevos Componentes QGS**: Añadir en `src/components/QGS/` en la carpeta apropiada

