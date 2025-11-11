import React from 'react';
import FormLayoutQGS from './FormLayoutQGS';
import QgisConfigProvider from '../../QGS/QgisConfigProvider';
import { FormProvider } from '../../QGS/Form/FormProvider';



export default {
  title: '02 - UI-QGS/FormLayoutQGS',
  component: FormLayoutQGS,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QgisConfigProvider
        qgsUrl="http://localhost/cgi-bin/qgis_mapserv.fcgi.exe"
        qgsProjectPath="C:/trabajos/gisbrick/QGIS/demo01.qgz"
        language="es"
        token={null}>
        <div style={{ padding: '20px' }}>
          <FormProvider layerName={'tabla'} featureId={null}>
            <Story />
          </FormProvider>

        </div>
      </QgisConfigProvider>
    ),
  ],
};

// Historia usando la capa "tabla" que es la más completa
export const TablaLayer = {
  args: {
  
  },
};

