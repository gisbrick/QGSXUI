import React from 'react';
import FormRow from './FormRow';

export default {
  title: '04 - UI/FormRow',
  component: FormRow,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs']
};

export const Default = {
  args: {
    label: 'Datos Personales',
    children: [
      <div key="1" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
        Campo 1
      </div>,
      <div key="2" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
        Campo 2
      </div>
    ]
  },
};

export const WithoutLabel = {
  args: {
    showLabel: false,
    children: [
      <input key="1" type="text" placeholder="Nombre" style={{ padding: '8px' }} />,
      <input key="2" type="text" placeholder="Apellido" style={{ padding: '8px' }} />,
      <input key="3" type="email" placeholder="Email" style={{ padding: '8px' }} />
    ]
  },
};

export const MultipleFields = {
  args: {
    label: 'Información Completa',
    children: [
      <input key="1" type="text" placeholder="Nombre" style={{ padding: '8px' }} />,
      <input key="2" type="text" placeholder="Apellido" style={{ padding: '8px' }} />,
      <input key="3" type="email" placeholder="Email" style={{ padding: '8px' }} />,
      <select key="4" style={{ padding: '8px' }}>
        <option>País</option>
        <option>España</option>
        <option>México</option>
      </select>
    ]
  },
};

export const TwoFields = {
  args: {
    label: 'Coordenadas',
    children: [
      <input key="1" type="number" placeholder="Latitud" style={{ padding: '8px' }} />,
      <input key="2" type="number" placeholder="Longitud" style={{ padding: '8px' }} />
    ]
  },
};
