import React from 'react';
import QgisConfigProvider from './QgisConfigProvider';
import Map from './Map/Map';
import Form from './Form/Form';
import Table from './Table/Table';
import { FormLayoutQGS } from '../UI_QGS';

export default {
  title: '01 - QGS/QgisConfigProvider',
  component: QgisConfigProvider,
  argTypes: {
    qgsUrl: { 
      control: 'text',
      description: 'URL del servicio QGIS Server'
    },
    qgsProjectPath: { 
      control: 'text',
      description: 'Nombre del proyecto QGIS'
    },
    language: { 
      control: 'select',
      options: ['en', 'es'],
      description: 'Idioma de la interfaz'
    }
  },
  tags: ['autodocs']
};

/**
 * Ejemplo básico del proveedor con configuración mínima
 */
export const Default = {
  args: { 
    qgsUrl: 'http://localhost/cgi-bin/qgis_mapserv.fcgi.exe',
    qgsProjectPath: 'C:/trabajos/gisbrick/QGIS/demo01.qgz',
    language: 'es',
    token: null,// Token opcional para autenticación
    tags: ['autodocs']
  },
  render: (args) => (
    <QgisConfigProvider {...args}>
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h3>Configuración QGIS Activa</h3>
        <p><strong>URL del servicio:</strong> {args.qgsUrl}</p>
        <p><strong>Proyecto:</strong> {args.qgsProjectPath}</p>
        <p><strong>Idioma:</strong> {args.language}</p>
      </div>
    </QgisConfigProvider>
  )
};

/**
 * Ejemplo con mapa usando el provider
 */
export const Mapa = {
  args: { 
    qgsUrl: 'http://localhost/cgi-bin/qgis_mapserv.fcgi.exe',
    qgsProjectPath: 'C:/trabajos/gisbrick/QGIS/demo01.qgz',
    language: 'es',
    token: null // Token opcional para autenticación
  },
  render: (args) => (
    <QgisConfigProvider {...args}>     
        <Map height={300} />        
    </QgisConfigProvider>
  )
};

/**
 * Ejemplo con formulario usando el provider
 */
export const Formulario = {
  args: { 
    qgsUrl: 'http://localhost/cgi-bin/qgis_mapserv.fcgi.exe',
    qgsProjectPath: 'C:/trabajos/gisbrick/QGIS/demo01.qgz',
    language: 'es',
    token: null // Token opcional para autenticación
  },
  render: (args) => (
    <QgisConfigProvider {...args}>      
        <Form layerName="tabla" />      
    </QgisConfigProvider>
  )
};

/**
 * Ejemplo con tabla usando el provider
 */
export const Tabla = {
  args: { 
    qgsUrl: 'http://localhost/cgi-bin/qgis_mapserv.fcgi.exe',
    qgsProjectPath: 'C:/trabajos/gisbrick/QGIS/demo01.qgz',
    language: 'es',
    token: null // Token opcional para autenticación
  },
  render: (args) => (
    <QgisConfigProvider {...args}>
        <Table layerName="tabla" />
    </QgisConfigProvider>
  )
};
