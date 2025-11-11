import React from 'react';
import Tabs from './Tabs';

export default {
  title: '04 - UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onTabChange: { action: 'tab-changed' }
  },
};

const sampleTabs = [
  {
    label: 'General',
    content: (
      <div style={{ padding: '20px' }}>
        <h3>Configuración General</h3>
        <p>Aquí va el contenido de la pestaña general.</p>
      </div>
    )
  },
  {
    label: 'Avanzado',
    content: (
      <div style={{ padding: '20px' }}>
        <h3>Configuración Avanzada</h3>
        <p>Aquí va el contenido de la pestaña avanzada.</p>
      </div>
    )
  },
  {
    label: 'Acerca de',
    content: (
      <div style={{ padding: '20px' }}>
        <h3>Acerca de</h3>
        <p>Información sobre la aplicación.</p>
      </div>
    )
  }
];

export const Default = {
  args: {
    tabs: sampleTabs,
    defaultActive: 0
  },
};

export const SecondTabActive = {
  args: {
    tabs: sampleTabs,
    defaultActive: 1
  },
};
