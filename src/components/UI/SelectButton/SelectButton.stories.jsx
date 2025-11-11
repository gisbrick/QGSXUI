import React from 'react';
import SelectButton from './SelectButton';
import Button from '../Button/Button';

export default {
  title: '04 - UI/SelectButton',
  component: SelectButton,
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
    gridColumns: {
      control: { type: 'number', min: 1, max: 6 },
    },
  },
};

export const Default = {
  args: {
    children: 'Seleccionar herramienta',
    options: [
      { label: 'Opción 1', value: 'option1' },
      { label: 'Opción 2', value: 'option2' },
      { label: 'Opción 3', value: 'option3' },
    ],
    onSelect: (option) => console.log('Selected:', option),
  },
};

export const WithIcons = {
  args: {
    children: 'Herramientas',
    icon: <i className="fas fa-tools" />,
    options: [
      { 
        label: 'Seleccionar', 
        value: 'select',
        icon: <i className="fg-arrow" />
      },
      { 
        label: 'Desplazar', 
        value: 'pan',
        icon: <i className="fg-move" />
      },
      { 
        label: 'Zoom', 
        value: 'zoom',
        icon: <i className="fg-zoom-in" />
      },
      { 
        label: 'Medir', 
        value: 'measure',
        icon: <i className="fg-measure" />
      },
    ],
    onSelect: (option) => console.log('Selected tool:', option),
  },
};

export const CircularWithGISTools = {
  args: {
    circular: true,
    icon: <i className="fg-arrow" />,
    size: 'medium',
    options: [
      <Button key="select" icon={<i className="fg-arrow" />} circular size="small" title="Seleccionar" />,
      <Button key="pan" icon={<i className="fg-move" />} circular size="small" title="Desplazar" />,
      <Button key="zoom-in" icon={<i className="fg-zoom-in" />} circular size="small" title="Zoom In" />,
      <Button key="zoom-out" icon={<i className="fg-zoom-out" />} circular size="small" title="Zoom Out" />,
      <Button key="measure-line" icon={<i className="fg-measure-line" />} circular size="small" title="Medir línea" />,
      <Button key="measure-area" icon={<i className="fg-measure-area" />} circular size="small" title="Medir área" />,
    ],
    onSelect: (option, index) => {
      console.log('Selected GIS tool:', { option, index });
    },
  },
};

export const GridWithImages = {
  args: {
    children: 'Mapas base',
    icon: <i className="fas fa-map" />,
    gridColumns: 3,
    options: [
      {
        label: 'OpenStreetMap',
        value: 'osm',
        image: 'https://tile.openstreetmap.org/8/131/95.png'
      },
      {
        label: 'Satélite',
        value: 'satellite',
        image: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/8/95/131'
      },
      {
        label: 'Topográfico',
        value: 'topo',
        image: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/8/95/131'
      },
      {
        label: 'Terreno',
        value: 'terrain',
        image: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/8/95/131'
      },
      {
        label: 'Calles',
        value: 'streets',
        image: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/8/95/131'
      },
      {
        label: 'Relieve',
        value: 'relief',
        image: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/8/95/131'
      },
    ],
    onSelect: (option) => console.log('Selected basemap:', option),
  },
};

export const AdvancedGISToolbar = {
  render: () => (
    <div style={{ 
      display: 'flex', 
      gap: '8px', 
      padding: '12px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      alignItems: 'center'
    }}>
      {/* Herramientas de navegación */}
      <SelectButton
        circular
        icon={<i className="fg-move" />}
        size="small"
        options={[
          <Button key="select" icon={<i className="fg-arrow" />} circular size="small" title="Seleccionar" />,
          <Button key="pan" icon={<i className="fg-move" />} circular size="small" title="Desplazar" selected />,
          <Button key="zoom-extent" icon={<i className="fg-extent" />} circular size="small" title="Zoom extensión" />,
        ]}
        onSelect={(option, index) => console.log('Navigation tool:', index)}
      />
      
      {/* Herramientas de zoom */}
      <SelectButton
        circular
        icon={<i className="fg-zoom-in" />}
        size="small"
        options={[
          <Button key="zoom-in" icon={<i className="fg-zoom-in" />} circular size="small" title="Zoom acercar" />,
          <Button key="zoom-out" icon={<i className="fg-zoom-out" />} circular size="small" title="Zoom alejar" />,
          <Button key="zoom-full" icon={<i className="fg-extent" />} circular size="small" title="Zoom total" />,
        ]}
        onSelect={(option, index) => console.log('Zoom tool:', index)}
      />
      
      {/* Herramientas de medición */}
      <SelectButton
        circular
        icon={<i className="fg-measure" />}
        size="small"
        options={[
          <Button key="measure-distance" icon={<i className="fg-measure-line" />} circular size="small" title="Medir distancia" />,
          <Button key="measure-area" icon={<i className="fg-measure-area" />} circular size="small" title="Medir área" />,
          <Button key="measure-bearing" icon={<i className="fg-azimuth" />} circular size="small" title="Medir azimut" />,
        ]}
        onSelect={(option, index) => console.log('Measure tool:', index)}
      />
      
      {/* Separador */}
      <div style={{ width: '1px', height: '28px', backgroundColor: '#dee2e6', margin: '0 4px' }} />
      
      {/* Selector de mapa base */}
      <SelectButton
        icon={<i className="fas fa-map" />}
        size="small"
        gridColumns={2}
        options={[
          {
            label: 'OSM',
            value: 'osm',
            image: 'https://tile.openstreetmap.org/8/131/95.png'
          },
          {
            label: 'Satélite',
            value: 'satellite',
            image: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/8/95/131'
          },
          {
            label: 'Topo',
            value: 'topo',
            image: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/8/95/131'
          },
          {
            label: 'Terreno',
            value: 'terrain',
            image: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/8/95/131'
          },
        ]}
        onSelect={(option) => console.log('Selected basemap:', option)}
      >
        Mapa base
      </SelectButton>
    </div>
  ),
};

export const Sizes = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <SelectButton
        size="small"
        options={[{ label: 'Opción 1' }, { label: 'Opción 2' }]}
      >
        Small
      </SelectButton>
      <SelectButton
        size="medium"
        options={[{ label: 'Opción 1' }, { label: 'Opción 2' }]}
      >
        Medium
      </SelectButton>
      <SelectButton
        size="large"
        options={[{ label: 'Opción 1' }, { label: 'Opción 2' }]}
      >
        Large
      </SelectButton>
    </div>
  ),
};
