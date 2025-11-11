import Switch from './Switch';

export default {
  title: '04 - UI/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    checked: {
      control: { type: 'boolean' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
    labelPosition: {
      control: { type: 'select' },
      options: ['left', 'right'],
    },
  },
};

export const Default = {
  args: {
    checked: false,
  },
};

export const Checked = {
  args: {
    checked: true,
  },
};

export const WithLabel = {
  args: {
    label: 'Activar notificaciones',
    checked: false,
  },
};

export const WithLabelLeft = {
  args: {
    label: 'Modo oscuro',
    labelPosition: 'left',
    checked: true,
  },
};

export const Disabled = {
  args: {
    disabled: true,
    label: 'Deshabilitado',
  },
};

export const DisabledChecked = {
  args: {
    disabled: true,
    checked: true,
    label: 'Deshabilitado activo',
  },
};

// Tamaños
export const Small = {
  args: {
    size: 'small',
    label: 'Switch pequeño',
    checked: false,
  },
};

export const Medium = {
  args: {
    size: 'medium',
    label: 'Switch mediano',
    checked: true,
  },
};

export const Large = {
  args: {
    size: 'large',
    label: 'Switch grande',
    checked: false,
  },
};

// Ejemplo de todos los tamaños
export const AllSizes = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ minWidth: '80px', fontSize: '14px' }}>Small:</span>
        <Switch size="small" label="Pequeño" checked={false} />
        <Switch size="small" checked={true} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ minWidth: '80px', fontSize: '14px' }}>Medium:</span>
        <Switch size="medium" label="Mediano" checked={false} />
        <Switch size="medium" checked={true} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ minWidth: '80px', fontSize: '14px' }}>Large:</span>
        <Switch size="large" label="Grande" checked={false} />
        <Switch size="large" checked={true} />
      </div>
    </div>
  ),
};

// Ejemplo GIS específico
export const GISSettings = {
  render: () => (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#333' }}>Configuración del mapa</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Switch 
          label="Mostrar coordenadas del cursor" 
          checked={true} 
          size="medium"
        />
        <Switch 
          label="Habilitar zoom con rueda del ratón" 
          checked={true} 
          size="medium"
        />
        <Switch 
          label="Mostrar escala del mapa" 
          checked={false} 
          size="medium"
        />
        <Switch 
          label="Activar modo de pantalla completa" 
          checked={false} 
          size="medium"
        />
        <Switch 
          label="Guardar configuración automáticamente" 
          checked={true} 
          size="medium"
        />
        <Switch 
          label="Modo desarrollador (debug)" 
          checked={false} 
          size="small"
          disabled
        />
      </div>
    </div>
  ),
};

// Ejemplo de diferentes estados
export const AllStates = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ minWidth: '120px', fontSize: '14px' }}>Inactivo:</span>
        <Switch label="Sin activar" checked={false} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ minWidth: '120px', fontSize: '14px' }}>Activo:</span>
        <Switch label="Activado" checked={true} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ minWidth: '120px', fontSize: '14px' }}>Deshabilitado:</span>
        <Switch label="Deshabilitado" disabled={true} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ minWidth: '120px', fontSize: '14px' }}>Deshabilitado + activo:</span>
        <Switch label="Deshabilitado activo" checked={true} disabled={true} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ minWidth: '120px', fontSize: '14px' }}>Label izquierda:</span>
        <Switch label="Etiqueta a la izquierda" labelPosition="left" checked={true} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ minWidth: '120px', fontSize: '14px' }}>Sin label:</span>
        <Switch checked={false} />
      </div>
    </div>
  ),
};
