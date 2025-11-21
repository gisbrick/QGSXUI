import React from 'react';
import Map from './Map';
import QgisConfigProvider from '../QgisConfigProvider';
import { CustomSearchExample } from './MapTools';

export default {
  title: '01 - QGS/Map',
  component: Map,
  tags: ['autodocs'],
  argTypes: {
    // Props del componente Map
    width: {
      control: 'text',
      description: 'Ancho del mapa'
    },
    height: {
      control: 'text',
      description: 'Alto del mapa'
    },
    showControls: {
      control: 'boolean',
      description: 'Mostrar controles del mapa'
    },
    // Props del QgisConfigProvider
    qgsUrl: {
      control: 'text',
      description: 'URL del servicio QGIS Server',
      table: {
        category: 'QgisConfigProvider'
      }
    },
    qgsProjectPath: {
      control: 'text',
      description: 'Ruta del proyecto QGIS',
      table: {
        category: 'QgisConfigProvider'
      }
    },
    language: {
      control: 'select',
      options: ['en', 'es'],
      description: 'Idioma de la interfaz',
      table: {
        category: 'QgisConfigProvider'
      }
    },
    token: {
      control: 'text',
      description: 'Token opcional para autenticación',
      table: {
        category: 'QgisConfigProvider'
      }
    }
  },
  decorators: [
    (Story, context) => {
      const { qgsUrl, qgsProjectPath, language, token, ...componentArgs } = context.args;
      // Filtrar las props del QgisConfigProvider y pasar solo las del componente al Story
      const filteredContext = {
        ...context,
        args: componentArgs
      };
      return (
        <QgisConfigProvider
          qgsUrl={qgsUrl}
          qgsProjectPath={qgsProjectPath}
          language={language}
          token={token}
        >
          <Story {...filteredContext} />
        </QgisConfigProvider>
      );
    }
  ]
};

export const Default = {
  args: {
    // Props del componente Map
    height: 400,
    showControls: true,
    // Props del QgisConfigProvider
    qgsUrl: 'http://localhost/cgi-bin/qgis_mapserv.fcgi.exe',
    qgsProjectPath: 'C:/trabajos/gisbrick/QGIS/demo01.qgz',
    language: 'es',
    token: null
  }
};

export const WithCustomSearcher = {
  args: {
    // Props del componente Map
    height: 600,
    showControls: true,
    // Props del QgisConfigProvider
    qgsUrl: 'http://localhost/cgi-bin/qgis_mapserv.fcgi.exe',
    qgsProjectPath: 'C:/trabajos/gisbrick/QGIS/demo01.qgz',
    language: 'es',
    token: null,
    // Buscador personalizado
    customSearchers: [
      {
        id: 'custom-location',
        render: () => (
          <CustomSearchExample
            onSearch={async (query) => {
              // Simular una búsqueda externa
              // En un caso real, aquí harías una llamada a una API externa
              console.log('[Story] Buscando:', query);
              
              // Simular delay de red
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const queryLower = query.toLowerCase();
              
              // Ejemplo: buscar coordenadas conocidas (Madrid)
              if (queryLower.includes('madrid')) {
                // Retornar múltiples resultados para demostrar la selección
                return [
                  {
                    id: 'madrid-1',
                    lat: 40.4168,
                    lon: -3.7038,
                    title: 'Madrid Centro, España',
                    description: 'Centro histórico de Madrid',
                    coordinates: '40.4168, -3.7038',
                    popupContent: `
                      <div style="text-align: center;">
                        <strong>Madrid Centro, España</strong><br/>
                        <small>Centro histórico de Madrid</small><br/>
                        <small>Coordenadas: 40.4168, -3.7038</small>
                      </div>
                    `
                  },
                  {
                    id: 'madrid-2',
                    lat: 40.4378,
                    lon: -3.6795,
                    title: 'Madrid Norte, España',
                    description: 'Zona norte de Madrid',
                    coordinates: '40.4378, -3.6795',
                    popupContent: `
                      <div style="text-align: center;">
                        <strong>Madrid Norte, España</strong><br/>
                        <small>Zona norte de Madrid</small><br/>
                        <small>Coordenadas: 40.4378, -3.6795</small>
                      </div>
                    `
                  },
                  {
                    id: 'madrid-3',
                    lat: 40.3833,
                    lon: -3.7167,
                    title: 'Madrid Sur, España',
                    description: 'Zona sur de Madrid',
                    coordinates: '40.3833, -3.7167',
                    popupContent: `
                      <div style="text-align: center;">
                        <strong>Madrid Sur, España</strong><br/>
                        <small>Zona sur de Madrid</small><br/>
                        <small>Coordenadas: 40.3833, -3.7167</small>
                      </div>
                    `
                  }
                ];
              }
              
              // Ejemplo: buscar coordenadas conocidas (Barcelona)
              if (queryLower.includes('barcelona')) {
                return [
                  {
                    id: 'barcelona-1',
                    lat: 41.3851,
                    lon: 2.1734,
                    title: 'Barcelona Centro, España',
                    description: 'Centro histórico de Barcelona',
                    coordinates: '41.3851, 2.1734',
                    popupContent: `
                      <div style="text-align: center;">
                        <strong>Barcelona Centro, España</strong><br/>
                        <small>Centro histórico de Barcelona</small><br/>
                        <small>Coordenadas: 41.3851, 2.1734</small>
                      </div>
                    `
                  },
                  {
                    id: 'barcelona-2',
                    lat: 41.3947,
                    lon: 2.1644,
                    title: 'Barcelona - Sagrada Familia, España',
                    description: 'Zona de la Sagrada Familia',
                    coordinates: '41.3947, 2.1644',
                    popupContent: `
                      <div style="text-align: center;">
                        <strong>Barcelona - Sagrada Familia, España</strong><br/>
                        <small>Zona de la Sagrada Familia</small><br/>
                        <small>Coordenadas: 41.3947, 2.1644</small>
                      </div>
                    `
                  }
                ];
              }
              
              // Si no coincide, retornar array vacío para indicar que no se encontró
              return [];
            }}
            placeholder="Buscar ciudad (ej: Madrid, Barcelona)..."
            icon="fa-map-marker-alt"
            searchLabel="Buscar"
          />
        )
      }
    ]
  }
};