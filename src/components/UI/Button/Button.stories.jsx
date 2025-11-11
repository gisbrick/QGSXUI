import Button from './Button';

export default {
  title: '04 - UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    circular: {
      control: { type: 'boolean' },
    },
    selected: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

export const Default = {
  args: {
    children: 'Button',
  },
};

export const WithIcon = {
  args: {
    children: 'Save',
    icon: <i className="fas fa-save" />,
  },
};

export const IconOnly = {
  args: {
    icon: <i className="fas fa-heart" />,
  },
};

export const Disabled = {
  args: {
    children: 'Disabled',
    disabled: true,
  },
};

// Estado seleccionado
export const Selected = {
  args: {
    children: 'Selected Tool',
    selected: true,
    icon: <i className="fas fa-wrench" />,
  },
};

export const SelectedCircular = {
  args: {
    icon: <i className="fas fa-crosshairs" />,
    circular: true,
    selected: true,
    size: 'medium',
  },
};

// Tamaños
export const Small = {
  args: {
    children: 'Small Button',
    size: 'small',
  },
};

export const Medium = {
  args: {
    children: 'Medium Button',
    size: 'medium',
  },
};

export const Large = {
  args: {
    children: 'Large Button',
    size: 'large',
  },
};

// Botones circulares
export const CircularSmall = {
  args: {
    icon: <i className="fas fa-check" />,
    circular: true,
    size: 'small',
  },
};

export const CircularMedium = {
  args: {
    icon: <i className="fas fa-star" />,
    circular: true,
    size: 'medium',
  },
};

export const CircularLarge = {
  args: {
    icon: <i className="fas fa-cog" />,
    circular: true,
    size: 'large',
  },
};

// Ejemplo combinado de diferentes tamaños
export const AllSizes = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
      <Button icon={<i className="fas fa-save" />} size="small">Small + Icon</Button>
      <Button icon={<i className="fas fa-save" />} size="medium">Medium + Icon</Button>
      <Button icon={<i className="fas fa-save" />} size="large">Large + Icon</Button>
    </div>
  ),
};

// Ejemplo de botones circulares
export const AllCircular = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button icon={<i className="fas fa-check" />} circular size="small" />
      <Button icon={<i className="fas fa-star" />} circular size="medium" />
      <Button icon={<i className="fas fa-cog" />} circular size="large" />
      <Button icon={<i className="fas fa-times" />} circular size="small" disabled />
      <Button icon={<i className="fas fa-folder" />} circular size="medium" />
      <Button icon={<i className="fas fa-search" />} circular size="large" />
    </div>
  ),
};

// Ejemplo de toolbar con herramientas activas
export const ToolbarExample = {
  render: () => (
    <div style={{ 
      display: 'flex', 
      gap: '8px', 
      padding: '12px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <Button icon={<i className="fg-move" />} circular size="small" selected />
      <Button icon={<i className="fg-arrow" />} circular size="small" />
      <Button icon={<i className="fg-polyline-pt" />} circular size="small" />
      <Button icon={<i className="fas fa-search-plus" />} circular size="small" />
      <Button icon={<i className="fg-offset" />} circular size="small" />
      <div style={{ width: '1px', height: '28px', backgroundColor: '#dee2e6', margin: '0 4px' }} />
      <Button icon={<i className="fas fa-undo" />} circular size="small" />
      <Button icon={<i className="fas fa-redo" />} circular size="small" />
    </div>
  ),
};

// Ejemplo de diferentes estados
export const AllStates = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
      <Button>Normal</Button>
      <Button selected>Selected</Button>
      <Button disabled>Disabled</Button>
      <Button icon={<i className="fas fa-tools" />}>With Icon</Button>
      <Button icon={<i className="fas fa-cog" />} selected>Selected + Icon</Button>
      <Button icon={<i className="fas fa-ban" />} disabled>Disabled + Icon</Button>
    </div>
  ),
};

// Ejemplo específico de iconos GIS
export const GISToolbar = {
  render: () => (
    <div style={{ 
      display: 'flex', 
      gap: '8px', 
      padding: '12px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <Button icon={<i className="fg-move" />} circular size="small" selected title="Pan" />
        <Button icon={<i className="fas fa-search-plus" />} circular size="small" title="Zoom In" />
        <Button icon={<i className="fas fa-search-minus" />} circular size="small" title="Zoom Out" />
      </div>
      <div style={{ width: '1px', height: '28px', backgroundColor: '#dee2e6' }} />
      <div style={{ display: 'flex', gap: '4px' }}>
        <Button icon={<i className="fg-point" />} circular size="small" title="Add Point" />
        <Button icon={<i className="fg-polyline-pt" />} circular size="small" title="Add Line" />
        <Button icon={<i className="fg-polygon" />} circular size="small" title="Add Polygon" />
      </div>
      <div style={{ width: '1px', height: '28px', backgroundColor: '#dee2e6' }} />
      <div style={{ display: 'flex', gap: '4px' }}>
        <Button icon={<i className="fg-modify-line" />} circular size="small" title="Edit" />
        <Button icon={<i className="fas fa-trash" />} circular size="small" title="Delete" />
        <Button icon={<i className="fg-offset" />} circular size="small" title="Measure" />
      </div>
    </div>
  ),
};
