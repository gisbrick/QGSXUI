import React, { useState } from 'react';
import SearchInput from './SearchInput';

export default {
  title: '04 - UI/SearchInput',
  component: SearchInput,
  parameters: {
    docs: {
      description: {
        component: 'Componente de búsqueda con input de texto y botón para limpiar el criterio de búsqueda.'
      }
    }
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Tamaño del input'
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Si el input está deshabilitado'
    },
    placeholder: {
      control: { type: 'text' },
      description: 'Texto placeholder'
    }
  }
};

export const Default = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <div style={{ width: '300px' }}>
        <SearchInput
          {...args}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <p style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>
          Valor: {value || '(vacío)'}
        </p>
      </div>
    );
  },
  args: {
    placeholder: 'Buscar...',
    size: 'medium',
    disabled: false
  }
};

export const Small = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <div style={{ width: '300px' }}>
        <SearchInput
          {...args}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    );
  },
  args: {
    placeholder: 'Buscar...',
    size: 'small',
    disabled: false
  }
};

export const Large = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <div style={{ width: '300px' }}>
        <SearchInput
          {...args}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    );
  },
  args: {
    placeholder: 'Buscar...',
    size: 'large',
    disabled: false
  }
};

export const Disabled = {
  render: (args) => {
    return (
      <div style={{ width: '300px' }}>
        <SearchInput {...args} />
      </div>
    );
  },
  args: {
    placeholder: 'Buscar...',
    size: 'medium',
    disabled: true,
    value: 'Texto de ejemplo'
  }
};

export const WithInitialValue = {
  render: (args) => {
    const [value, setValue] = useState('Texto inicial');
    return (
      <div style={{ width: '300px' }}>
        <SearchInput
          {...args}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    );
  },
  args: {
    placeholder: 'Buscar...',
    size: 'medium',
    disabled: false
  }
};

export const WithCustomPlaceholder = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <div style={{ width: '300px' }}>
        <SearchInput
          {...args}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    );
  },
  args: {
    placeholder: 'Escribe para buscar...',
    size: 'medium',
    disabled: false
  }
};

