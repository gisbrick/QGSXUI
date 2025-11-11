# Mocks de QGIS Server

Este directorio contiene archivos JSON mockeados que sirven como **referencia** de la estructura de datos que devuelve QGIS Server.

## ⚠️ Importante

**Estos mocks NO se usan para interceptar peticiones**. Las peticiones siempre van al servidor QGIS real. Los mocks solo sirven como documentación y referencia de la estructura de datos.

## Archivos disponibles

- `qgis/demo01.qgz.QGISPRJ.json` - Respuesta del servicio QGISPRJ (configuración del proyecto)
- `qgis/demo01.qgz.WMTSLAYERS.json` - Respuesta del servicio WMTSLAYERS (capas base)
- `qgis/demo01.qgz.GetCapabilities.xml` - Respuesta del servicio WMS GetCapabilities

## Uso

Estos archivos pueden ser importados en el código para:
- Entender la estructura de datos
- Usar como tipos/interfaces en TypeScript
- Documentación de la API
- Referencia durante el desarrollo

## Ejemplo de importación

```javascript
import qgisPrjMock from './mocks/qgis/demo01.qgz.QGISPRJ.json';

// Usar como referencia de estructura
console.log(qgisPrjMock.layers);
```

