import React from 'react';
import FormFieldQGS from './FormFieldQGS';
import QgisConfigProvider from '../../QGS/QgisConfigProvider';



export default {
  title: '02 - UI-QGS/FormFieldQGS',
  component: FormFieldQGS,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QgisConfigProvider
        qgsUrl="http://localhost/cgi-bin/qgis_mapserv.fcgi.exe"
        qgsProjectPath="C:/trabajos/gisbrick/QGIS/demo01.qgz"
        language="es"      >
        <div style={{ padding: '20px' }}>
          <Story />
        </div>
      </QgisConfigProvider>
    ),
  ],
};

// Historia usando la capa "tabla" que es la más completa
export const FieldSample01 = {
  args: {
    layerName: 'tabla',
    featureId: 1,
    field_idx: 1,
    field_name: "aaa",
  },
};
