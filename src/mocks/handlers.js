// ⚠️ NOTA: Estos handlers NO están activos por defecto
// Las peticiones siempre van al servidor QGIS real.
// Este archivo se mantiene solo como referencia de cómo se podrían mockear las peticiones
// si fuera necesario en el futuro (por ejemplo, para tests o desarrollo offline).

import { http, HttpResponse } from 'msw';
import qgisPrjMock from './qgis/demo01.qgz.QGISPRJ.json';
import wmtsLayersMock from './qgis/demo01.qgz.WMTSLAYERS.json';

// Mock de respuestas WFS para diferentes capas
const createWFSHitsResponse = (count) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs" 
                       xmlns:gml="http://www.opengis.net/gml" 
                       xmlns:ogc="http://www.opengis.net/ogc" 
                       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
                       numberOfFeatures="${count}" 
                       timeStamp="2024-01-01T00:00:00Z">
</wfs:FeatureCollection>`;
};

const createWFSFeaturesResponse = (layerName, features = []) => {
  return {
    type: 'FeatureCollection',
    features: features.map((feature, index) => ({
      type: 'Feature',
      id: `${layerName}.${index + 1}`,
      geometry: feature.geometry || null,
      properties: feature.properties || {}
    }))
  };
};

// Mocks de features para diferentes capas
const mockFeatures = {
  'punto_t': [
    {
      geometry: {
        type: 'Point',
        coordinates: [-3.7038, 40.4168]
      },
      properties: {
        id: 1,
        nombre: 'Punto de prueba 1'
      }
    },
    {
      geometry: {
        type: 'Point',
        coordinates: [-3.7100, 40.4200]
      },
      properties: {
        id: 2,
        nombre: 'Punto de prueba 2'
      }
    }
  ],
  'tabla': [
    {
      geometry: null,
      properties: {
        id: 1,
        campo1: 'Valor 1',
        campo2: 'Valor 2'
      }
    }
  ],
  'tabla_maestra': [
    {
      geometry: null,
      properties: {
        id: 1,
        nombre: 'Registro maestro 1'
      }
    }
  ],
  'feature_tabla_relation': [
    {
      geometry: null,
      properties: {
        id: 1,
        relacion_id: 1
      }
    }
  ],
  'tabla_relation': [
    {
      geometry: null,
      properties: {
        id: 1,
        nombre: 'Relación 1'
      }
    }
  ]
};

// ⚠️ HANDLERS DESACTIVADOS - Las peticiones van al servidor real
// Para activar estos handlers, descomentar y configurar MSW en .storybook/preview.ts
export const handlers = [
  // Handler para QGISPRJ (configuración del proyecto)
  // http.get('*/cgi-bin/qgis_mapserv.fcgi.exe', ({ request }) => {
  //   const url = new URL(request.url);
  //   const service = url.searchParams.get('SERVICE');
  //   const allServices = url.searchParams.getAll('SERVICE');
  //   
  //   if (allServices.includes('QGISPRJ') || service === 'QGISPRJ') {
  //     return HttpResponse.json(qgisPrjMock);
  //   }
  //   
  //   if (service === 'WMTSLAYERS') {
  //     return HttpResponse.json(wmtsLayersMock);
  //   }
  //   
  //   // WFS handlers...
  //   return new HttpResponse(null, { status: 404 });
  // }),
];
