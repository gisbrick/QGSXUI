# Guía para Añadir Nuevos Idiomas

Esta guía explica cómo añadir nuevos idiomas a la aplicación de forma sencilla.

## Pasos para Añadir un Nuevo Idioma

### 1. Añadir el Idioma en la Configuración

Edita el archivo `src/config/languages.js` y añade la configuración del nuevo idioma en el objeto `SUPPORTED_LANGUAGES`:

```javascript
export const SUPPORTED_LANGUAGES = {
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸'
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧'
  },
  // Añade tu nuevo idioma aquí:
  ca: {
    code: 'ca',
    name: 'Catalan',
    nativeName: 'Català',
    flag: '🇪🇸'
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷'
  }
};
```

### 2. Crear el Archivo de Traducción

Crea un nuevo directorio en `src/locales/` con el código del idioma (ej: `ca` para catalán, `fr` para francés) y añade un archivo `translation.json`:

```
src/locales/
  ├── en/
  │   └── translation.json
  ├── es/
  │   └── translation.json
  ├── ca/          ← Nuevo directorio
  │   └── translation.json  ← Nuevo archivo
  └── fr/           ← Nuevo directorio
      └── translation.json  ← Nuevo archivo
```

### 3. Copiar y Traducir el Contenido

Copia el contenido de `src/locales/es/translation.json` (o `en/translation.json`) a tu nuevo archivo y traduce todas las cadenas de texto.

**Importante:** Mantén la misma estructura de claves. Solo cambia los valores (textos traducidos).

Ejemplo:

```json
{
  "ui": {
    "common": {
      "save": "Guardar",        // En español
      "save": "Save",           // En inglés
      "save": "Desar",          // En catalán
      "save": "Enregistrer"     // En francés
    }
  }
}
```

### 4. Usar el Nuevo Idioma

Una vez añadido el idioma y creado el archivo de traducción, simplemente pasa el código del idioma al `QgisConfigProvider`:

```jsx
<QgisConfigProvider
  qgsUrl="..."
  qgsProjectPath="..."
  language="ca"  // ← Usa el código del nuevo idioma
  token={token}
>
  {/* Tu aplicación */}
</QgisConfigProvider>
```

El sistema cargará automáticamente las traducciones del nuevo idioma.

## Sistema de Fallback

El sistema tiene un sistema de fallback inteligente:

1. **Primero** intenta cargar el idioma solicitado
2. **Si falla**, intenta con el idioma por defecto (`es`)
3. **Si también falla**, intenta con el idioma de fallback secundario (`en`)
4. **Si todo falla**, devuelve un objeto vacío (se mostrarán las claves de traducción)

## Notas Importantes

- Los idiomas `es` y `en` están importados estáticamente para carga rápida inicial
- Otros idiomas se cargan dinámicamente cuando se necesitan
- El sistema normaliza automáticamente códigos de idioma no válidos al idioma por defecto
- Las traducciones se cachean para evitar recargas innecesarias

## Validación de Mensajes

Los mensajes de validación de formularios tienen un fallback hardcodeado solo para `es` y `en`. Para otros idiomas, **debes añadir todas las claves de validación** en el archivo `translation.json` del nuevo idioma, especialmente:

- `ui.qgis.validation.*` - Todas las claves de validación
- `ui.qgis.validation.*WithField` - Versiones con nombre de campo

Consulta `src/locales/es/translation.json` o `src/locales/en/translation.json` para ver todas las claves necesarias.

## Ejemplo Completo: Añadir Catalán

1. **Editar `src/config/languages.js`:**
```javascript
ca: {
  code: 'ca',
  name: 'Catalan',
  nativeName: 'Català',
  flag: '🇪🇸'
}
```

2. **Crear `src/locales/ca/translation.json`** (copiar de `es/translation.json` y traducir)

3. **Usar en la aplicación:**
```jsx
<QgisConfigProvider language="ca" ...>
```

¡Y listo! El sistema cargará automáticamente las traducciones en catalán.

