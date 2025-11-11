import React from 'react';
import Map from './Map';
import QgisConfigProvider from '../QgisConfigProvider';

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
    controlsPosition: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Posición de los controles'
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
    controlsPosition: 'right',
    // Props del QgisConfigProvider
    qgsUrl: 'http://localhost/cgi-bin/qgis_mapserv.fcgi.exe',
    qgsProjectPath: 'C:/trabajos/gisbrick/QGIS/demo01.qgz',
    language: 'es',
    token: null
  }
};