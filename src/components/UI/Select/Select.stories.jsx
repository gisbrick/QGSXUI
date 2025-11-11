import Select from './Select';

export default {
  title: '04 - UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

// Opciones de ejemplo
const simpleOptions = ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'];

const complexOptions = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

const gisOptions = [
  { value: 'point', label: 'Punto' },
  { value: 'line', label: 'Línea' },
  { value: 'polygon', label: 'Polígono' },
  { value: 'multipoint', label: 'Multi-punto' },
  { value: 'multiline', label: 'Multi-línea' },
  { value: 'multipolygon', label: 'Multi-polígono' },
];

export const Default = {
  args: {
    options: simpleOptions,
    placeholder: 'Selecciona una opción',
  },
};

export const WithValue = {
  args: {
    options: complexOptions,
    value: 'es',
    placeholder: 'Selecciona idioma',
  },
};

export const Disabled = {
  args: {
    options: simpleOptions,
    disabled: true,
    placeholder: 'Deshabilitado',
  },
};

// Tamaños
export const Small = {
  args: {
    options: complexOptions,
    size: 'small',
    placeholder: 'Select pequeño',
  },
};

export const Medium = {
  args: {
    options: complexOptions,
    size: 'medium',
    placeholder: 'Select mediano',
  },
};

export const Large = {
  args: {
    options: complexOptions,
    size: 'large',
    placeholder: 'Select grande',
  },
};

// Ejemplo de todos los tamaños
export const AllSizes = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ minWidth: '80px', fontSize: '14px' }}>Small:</span>
        <Select 
          options={complexOptions} 
          size="small" 
          placeholder="Pequeño"
          style={{ width: '150px' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ minWidth: '80px', fontSize: '14px' }}>Medium:</span>
        <Select 
          options={complexOptions} 
          size="medium" 
          placeholder="Mediano"
          style={{ width: '180px' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ minWidth: '80px', fontSize: '14px' }}>Large:</span>
        <Select 
          options={complexOptions} 
          size="large" 
          placeholder="Grande"
          style={{ width: '220px' }}
        />
      </div>
    </div>
  ),
};

// Ejemplo GIS específico
export const GISGeometrySelector = {
  render: () => (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#333' }}>Seleccionar tipo de geometría</h4>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Select
          options={gisOptions}
          placeholder="Tipo de geometría"
          size="medium"
          style={{ width: '200px' }}
        />
        <Select
          options={[
            { value: 'wgs84', label: 'WGS84 (EPSG:4326)' },
            { value: 'utm30n', label: 'UTM 30N (EPSG:25830)' },
            { value: 'utm31n', label: 'UTM 31N (EPSG:25831)' },
            { value: 'webmercator', label: 'Web Mercator (EPSG:3857)' },
          ]}
          placeholder="Sistema de coordenadas"
          size="medium"
          style={{ width: '220px' }}
        />
      </div>
    </div>
  ),
};

// Ejemplo de diferentes estados
export const AllStates = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ minWidth: '120px', fontSize: '14px' }}>Normal:</span>
        <Select options={simpleOptions} placeholder="Selecciona..." />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ minWidth: '120px', fontSize: '14px' }}>Con valor:</span>
        <Select options={simpleOptions} value="Opción 2" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ minWidth: '120px', fontSize: '14px' }}>Deshabilitado:</span>
        <Select options={simpleOptions} disabled placeholder="Deshabilitado" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ minWidth: '120px', fontSize: '14px' }}>Deshabilitado + valor:</span>
        <Select options={simpleOptions} value="Opción 3" disabled />
      </div>
    </div>
  ),
};
