import React from 'react';
import Table from './Table';
import TablePaginated from './TablePaginated';
import TableInfiniteScroll from './TableInfiniteScroll';
import QgisConfigProvider from '../QgisConfigProvider';

export default {
  title: '01 - QGS/Table',
  component: Table,
  tags: ['autodocs'],
  argTypes: {
    // Props del componente Table
    layerName: {
      control: 'text',
      description: 'ID de la capa QGIS'
    },
    maxRows: {
      control: 'number',
      description: 'Número máximo de filas a mostrar'
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
      return (
        <QgisConfigProvider
          qgsUrl={qgsUrl}
          qgsProjectPath={qgsProjectPath}
          language={language}
          token={token}
        >
          <Story args={componentArgs} />
        </QgisConfigProvider>
      );
    }
  ]
};

/**
 * Tabla básica con configuración en español
 */
export const Default = {
  args: {
    // Props del componente Table
    layerName: 'tabla',
    maxRows: 10,
    // Props del QgisConfigProvider
    qgsUrl: 'http://localhost/cgi-bin/qgis_mapserv.fcgi.exe',
    qgsProjectPath: 'C:/trabajos/gisbrick/QGIS/demo01.qgz',
    language: 'es',
    token: null
  }
};

export const Paginated = {
  args: {
    layerName: 'tabla',
    defaultPageSize: 10,
    qgsUrl: 'http://localhost/cgi-bin/qgis_mapserv.fcgi.exe',
    qgsProjectPath: 'C:/trabajos/gisbrick/QGIS/demo01.qgz',
    language: 'es',
    token: null
  },
  render: (args) => <TablePaginated {...args} />
};

export const InfiniteScroll = {
  args: {
    layerName: 'tabla',
    chunkSize: 40,
    height: 360,
    qgsUrl: 'http://localhost/cgi-bin/qgis_mapserv.fcgi.exe',
    qgsProjectPath: 'C:/trabajos/gisbrick/QGIS/demo01.qgz',
    language: 'es',
    token: null
  },
  render: (args) => <TableInfiniteScroll {...args} />
};