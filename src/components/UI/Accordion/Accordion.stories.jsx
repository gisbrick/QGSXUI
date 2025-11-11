import React, { useState } from 'react';
import Accordion from './Accordion';

export default {
  title: '04 - UI/Accordion',
  component: Accordion,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs']
};

// Modo simple (retrocompatibilidad)
export const Default = {
  args: {
    title: 'Sección 1',
    children: <p>Contenido del accordion</p>
  }
};

export const DefaultOpen = {
  args: {
    title: 'Sección Abierta',
    defaultOpen: true,
    children: <p>Esta sección está abierta por defecto</p>
  }
};

// Modo avanzado con múltiples items
export const MultipleItems = {
  args: {
    items: [
      {
        title: 'Configuración General',
        content: (
          <div>
            <p>Opciones de configuración general del sistema.</p>
            <input type="text" placeholder="Nombre de usuario" />
          </div>
        )
      },
      {
        title: 'Configuración Avanzada',
        content: (
          <div>
            <p>Configuraciones para usuarios avanzados.</p>
            <label>
              <input type="checkbox" /> Habilitar modo debug
            </label>
          </div>
        )
      },
      {
        title: 'Información',
        content: (
          <div>
            <p>Información sobre la aplicación.</p>
            <p><strong>Versión:</strong> 1.0.0</p>
          </div>
        )
      }
    ],
    expandedItems: [0] // Primera sección abierta por defecto
  }
};

// Con control externo del estado
export const ControlledExpansion = {
  render: () => {
    const [expandedItems, setExpandedItems] = useState([1]);
    
    const items = [
      {
        title: 'Datos Personales',
        content: <p>Formulario de datos personales</p>
      },
      {
        title: 'Preferencias',
        content: <p>Configuración de preferencias del usuario</p>
      },
      {
        title: 'Notificaciones',
        content: <p>Configuración de notificaciones</p>
      }
    ];

    const handleToggle = (index) => {
      setExpandedItems(prev => 
        prev.includes(index) 
          ? prev.filter(i => i !== index)
          : [...prev, index]
      );
    };

    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => setExpandedItems([0, 1, 2])}>
            Expandir Todas
          </button>
          <button onClick={() => setExpandedItems([])} style={{ marginLeft: '10px' }}>
            Contraer Todas
          </button>
        </div>
        <Accordion 
          items={items}
          expandedItems={expandedItems}
          onToggle={handleToggle}
        />
      </div>
    );
  }
};