import React from 'react';
import Form from './Form';
import QgisConfigProvider from '../QgisConfigProvider';

const mockFeatureData = { field1: "Test Value", field2: true, field3: "A" };

export default {
  title: '01 - QGS/Form',
  component: Form,
  tags: ['autodocs'],
  argTypes: {
    // Props del componente Form
    layerName: {
      control: 'text',
      description: 'Nombre de la capa QGIS'
    },
    featureId: {
      control: 'text',
      description: 'ID de la feature a editar'
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
    // Props del componente Form
    layerName: 'tabla',
    featureId: null,
    // Props del QgisConfigProvider
    qgsUrl: 'http://localhost/cgi-bin/qgis_mapserv.fcgi.exe',
    qgsProjectPath: 'C:/trabajos/gisbrick/QGIS/demo01.qgz',
    language: 'es',
    token: null
  }
};