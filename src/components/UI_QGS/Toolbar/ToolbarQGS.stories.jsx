import React, { useState } from 'react';
import ToolbarQGS from './ToolbarQGS';
import { Button } from '../../UI';

export default {
  title: '02 - UI-QGS/ToolbarQGS',
  component: ToolbarQGS,
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs']
};

const Template = (args) => <ToolbarQGS {...args} />;

const TemplateWithState = (args) => {
  const [selectedTool, setSelectedTool] = useState(args.selectedTool);
  
  return (
    <ToolbarQGS
      {...args}
      selectedTool={selectedTool}
      onToolChange={setSelectedTool}
    />
  );
};

export const Default = Template.bind({});
Default.args = {
  items: [
    { 
      key: 'save', 
      type: 'action', 
      label: 'Guardar',
      onClick: () => console.log('Save clicked')
    },
    { 
      key: 'open', 
      type: 'action', 
      label: 'Abrir',
      onClick: () => console.log('Open clicked')
    }
  ],
  size: 'medium'
};

export const WithTools = TemplateWithState.bind({});
WithTools.args = {
  items: [
    { 
      key: 'select', 
      type: 'tool', 
      circular: true,
      icon: 'fas fa-mouse-pointer',
      title: 'Seleccionar'
    },
    { 
      key: 'pan', 
      type: 'tool', 
      circular: true,
      icon: 'fas fa-hand-paper',
      title: 'Desplazar'
    }
  ],
  size: 'medium',
  selectedTool: 'select'
};

export const CompleteGISToolbar = TemplateWithState.bind({});
CompleteGISToolbar.args = {
  items: [
    // Botones de acción
    { 
      key: 'new-project', 
      type: 'action', 
      circular: true,
      icon: <i className="fg-map-add" />,
      title: 'Nuevo proyecto',
      onClick: () => console.log('Nuevo proyecto')
    },
    { 
      key: 'open-project', 
      type: 'action', 
      circular: true,
      icon: <i className="fg-folder-map" />,
      title: 'Abrir proyecto',
      onClick: () => console.log('Abrir proyecto')
    },
    { 
      key: 'save-project', 
      type: 'action', 
      circular: true,
      icon: <i className="fg-layer-download" />,
      title: 'Guardar proyecto',
      onClick: () => console.log('Guardar proyecto')
    },
    
    // Select para capas base
    { 
      key: 'basemap-select', 
      type: 'select', 
      options: [
        { value: 'osm', label: 'OpenStreetMap' },
        { value: 'satellite', label: 'Satélite' },
        { value: 'terrain', label: 'Terreno' },
        { value: 'topographic', label: 'Topográfico' }
      ],
      value: 'osm',
      placeholder: 'Mapa base',
      onChange: (value) => console.log('Mapa base seleccionado:', value)
    },
    
    // Herramientas de navegación
    { 
      key: 'select-tool', 
      type: 'tool', 
      circular: true,
      icon: <i className="fg-arrow" />,
      title: 'Herramienta de selección'
    },
    { 
      key: 'pan-tool', 
      type: 'tool', 
      circular: true,
      icon: <i className="fg-move" />,
      title: 'Desplazar mapa'
    },
    { 
      key: 'zoom-in', 
      type: 'tool', 
      circular: true,
      icon: <i className="fg-zoom-in" />,
      title: 'Zoom acercar'
    },
    { 
      key: 'zoom-out', 
      type: 'tool', 
      circular: true,
      icon: <i className="fg-zoom-out" />,
      title: 'Zoom alejar'
    },
    
    // Herramientas de medición
    { 
      key: 'measure-distance', 
      type: 'tool', 
      circular: true,
      icon: <i className="fg-measure-line" />,
      title: 'Medir distancia'
    },
    { 
      key: 'measure-area', 
      type: 'tool', 
      circular: true,
      icon: <i className="fg-measure-area" />,
      title: 'Medir área'
    },
    
    // SelectButton con herramientas de dibujo
    { 
      key: 'draw-tools', 
      type: 'selectButton', 
      circular: true,
      icon: <i className="fg-polygon" />,
      title: 'Herramientas de dibujo',
      placeholder: 'Dibujo',
      options: [
        {
          key: 'draw-point',
          toolKey: 'draw-point-tool',
          element: <Button 
            circular 
            size="small" 
            icon={<i className="fg-point" />} 
            title="Dibujar punto"
            onClick={() => console.log('Dibujar punto')}
          />
        },
        {
          key: 'draw-line',
          toolKey: 'draw-line-tool',
          element: <Button 
            circular 
            size="small" 
            icon={<i className="fg-polyline" />} 
            title="Dibujar línea"
            onClick={() => console.log('Dibujar línea')}
          />
        },
        {
          key: 'draw-polygon',
          toolKey: 'draw-polygon-tool',
          element: <Button 
            circular 
            size="small" 
            icon={<i className="fg-polygon" />} 
            title="Dibujar polígono"
            onClick={() => console.log('Dibujar polígono')}
          />
        },
        {
          key: 'draw-rectangle',
          toolKey: 'draw-rectangle-tool',
          element: <Button 
            circular 
            size="small" 
            icon={<i className="fg-rectangle" />} 
            title="Dibujar rectángulo"
            onClick={() => console.log('Dibujar rectángulo')}
          />
        },
        {
          key: 'draw-circle',
          toolKey: 'draw-circle-tool',
          element: <Button 
            circular 
            size="small" 
            icon={<i className="fg-circle" />} 
            title="Dibujar círculo"
            onClick={() => console.log('Dibujar círculo')}
          />
        }
      ],
      onSelect: (option, index) => console.log('Herramienta de dibujo seleccionada:', option.key)
    },
    
    // Select para sistema de coordenadas
    { 
      key: 'crs-select', 
      type: 'select', 
      options: [
        { value: 'EPSG:4326', label: 'WGS84 (EPSG:4326)' },
        { value: 'EPSG:3857', label: 'Web Mercator (EPSG:3857)' },
        { value: 'EPSG:25830', label: 'ETRS89 UTM30N (EPSG:25830)' },
        { value: 'EPSG:2154', label: 'RGF93 Lambert-93 (EPSG:2154)' }
      ],
      value: 'EPSG:4326',
      placeholder: 'Sistema coordenadas',
      onChange: (value) => console.log('CRS seleccionado:', value)
    },
    
    // SelectButton con grid de mapas base
    { 
      key: 'basemap-grid', 
      type: 'selectButton', 
      icon: <i className="fg-world-map" />,
      title: 'Capas base',
      placeholder: 'Mapa base',
      gridColumns: 3,
      options: [
        {
          key: 'osm',
          element: <div style={{
            width: '80px',
            height: '60px',
            backgroundColor: '#f0f8ff',
            border: '2px solid #4169e1',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#4169e1',
            cursor: 'pointer'
          }}>OSM</div>
        },
        {
          key: 'satellite',
          element: <div style={{
            width: '80px',
            height: '60px',
            backgroundColor: '#2d4a2d',
            border: '2px solid #228b22',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#90ee90',
            cursor: 'pointer'
          }}>SAT</div>
        },
        {
          key: 'terrain',
          element: <div style={{
            width: '80px',
            height: '60px',
            backgroundColor: '#deb887',
            border: '2px solid #8b4513',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#8b4513',
            cursor: 'pointer'
          }}>TOPO</div>
        },
        {
          key: 'hybrid',
          element: <div style={{
            width: '80px',
            height: '60px',
            backgroundColor: '#483d8b',
            border: '2px solid #6a5acd',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#e6e6fa',
            cursor: 'pointer'
          }}>HYB</div>
        },
        {
          key: 'ortho',
          element: <div style={{
            width: '80px',
            height: '60px',
            backgroundColor: '#708090',
            border: '2px solid #2f4f4f',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#f5f5f5',
            cursor: 'pointer'
          }}>ORTHO</div>
        },
        {
          key: 'custom',
          element: <div style={{
            width: '80px',
            height: '60px',
            backgroundColor: '#800080',
            border: '2px solid #9400d3',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#dda0dd',
            cursor: 'pointer'
          }}>CUSTOM</div>
        }
      ],
      onSelect: (option, index) => console.log('Mapa base seleccionado:', option.key)
    },
    
    // Switches para opciones de visualización
    { 
      key: 'labels-visible', 
      type: 'switch', 
      label: 'Etiquetas',
      checked: true,
      labelPosition: 'right',
      onChange: (checked) => console.log('Mostrar etiquetas:', checked)
    },
    { 
      key: 'grid-visible', 
      type: 'switch', 
      label: 'Cuadrícula',
      checked: false,
      labelPosition: 'right',
      onChange: (checked) => console.log('Mostrar cuadrícula:', checked)
    },
    { 
      key: 'scale-visible', 
      type: 'switch', 
      label: 'Escala',
      checked: true,
      labelPosition: 'right',
      onChange: (checked) => console.log('Mostrar escala:', checked)
    }
  ],
  size: 'medium',
  selectedTool: 'select-tool'
};

export const SmallGISToolbar = TemplateWithState.bind({});
SmallGISToolbar.args = {
  items: [
    { 
      key: 'save', 
      type: 'action', 
      circular: true,
      icon: <i className="fg-layer-download" />,
      title: 'Guardar',
      onClick: () => console.log('Guardar')
    },
    { 
      key: 'layers', 
      type: 'select', 
      options: [
        { value: 'osm', label: 'OSM' },
        { value: 'sat', label: 'Satélite' }
      ],
      value: 'osm',
      onChange: (value) => console.log('Capa:', value)
    },
    { 
      key: 'select-tool', 
      type: 'tool', 
      circular: true,
      icon: <i className="fg-arrow" />,
      title: 'Seleccionar'
    },
    { 
      key: 'pan-tool', 
      type: 'tool', 
      circular: true,
      icon: <i className="fg-move" />,
      title: 'Desplazar'
    },
    { 
      key: 'labels', 
      type: 'switch', 
      label: 'Labels',
      checked: true,
      onChange: (checked) => console.log('Labels:', checked)
    }
  ],
  size: 'small',
  selectedTool: 'select-tool'
};

export const LargeGISToolbar = TemplateWithState.bind({});
LargeGISToolbar.args = {
  items: [
    { 
      key: 'new', 
      type: 'action', 
      circular: true,
      icon: <i className="fg-map-add" />,
      title: 'Nuevo proyecto',
      onClick: () => console.log('Nuevo')
    },
    { 
      key: 'open', 
      type: 'action', 
      circular: true,
      icon: <i className="fg-folder-map" />,
      title: 'Abrir proyecto',
      onClick: () => console.log('Abrir')
    },
    { 
      key: 'basemap', 
      type: 'select', 
      options: [
        { value: 'osm', label: 'OpenStreetMap' },
        { value: 'satellite', label: 'Vista Satélite' },
        { value: 'terrain', label: 'Relieve' }
      ],
      value: 'osm',
      placeholder: 'Seleccionar mapa base',
      onChange: (value) => console.log('Mapa base:', value)
    },
    { 
      key: 'select', 
      type: 'tool', 
      circular: true,
      icon: <i className="fg-arrow" />,
      title: 'Herramienta de selección'
    },
    { 
      key: 'pan', 
      type: 'tool', 
      circular: true,
      icon: <i className="fg-move" />,
      title: 'Herramienta de desplazamiento'
    },
    { 
      key: 'zoom-in', 
      type: 'tool', 
      circular: true,
      icon: <i className="fg-zoom-in" />,
      title: 'Zoom acercar'
    },
    { 
      key: 'measure', 
      type: 'tool', 
      circular: true,
      icon: <i className="fg-measure" />,
      title: 'Herramienta de medición'
    },
    { 
      key: 'labels-switch', 
      type: 'switch', 
      label: 'Mostrar etiquetas',
      checked: true,
      labelPosition: 'right',
      onChange: (checked) => console.log('Etiquetas:', checked)
    },
    { 
      key: 'grid-switch', 
      type: 'switch', 
      label: 'Mostrar cuadrícula',
      checked: false,
      labelPosition: 'right',
      onChange: (checked) => console.log('Cuadrícula:', checked)
    }
  ],
  size: 'large',
  selectedTool: 'select'
};

export const SelectButtonDemo = TemplateWithState.bind({});
SelectButtonDemo.args = {
  items: [
    // SelectButton simple con herramientas de edición
    { 
      key: 'edit-tools', 
      type: 'selectButton', 
      circular: true,
      icon: <i className="fg-modify-line" />,
      title: 'Herramientas de edición',
      options: [
        {
          key: 'edit-move',
          toolKey: 'edit-move-tool',
          element: <Button 
            circular 
            size="small" 
            icon={<i className="fg-move" />} 
            title="Mover"
          />
        },
        {
          key: 'edit-rotate',
          toolKey: 'edit-rotate-tool', 
          element: <Button 
            circular 
            size="small" 
            icon={<i className="fg-rotate" />} 
            title="Rotar"
          />
        },
        {
          key: 'edit-scale',
          toolKey: 'edit-scale-tool',
          element: <Button 
            circular 
            size="small" 
            icon={<i className="fg-scale-poly" />} 
            title="Escalar"
          />
        }
      ]
    },
    
    // SelectButton con grid de capas temáticas
    { 
      key: 'layer-themes', 
      type: 'selectButton', 
      icon: <i className="fg-layers" />,
      title: 'Capas temáticas',
      gridColumns: 2,
      options: [
        {
          key: 'roads',
          element: <div style={{
            width: '70px',
            height: '50px',
            backgroundColor: '#1e40af',
            border: '2px solid #3b82f6',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white',
            cursor: 'pointer'
          }}>
            <i className="fg-road-map" style={{ fontSize: '16px', marginBottom: '2px' }} />
            ROADS
          </div>
        },
        {
          key: 'hydro',
          element: <div style={{
            width: '70px',
            height: '50px',
            backgroundColor: '#1e3a8a',
            border: '2px solid #3b82f6',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white',
            cursor: 'pointer'
          }}>
            <i className="fg-hydro-map" style={{ fontSize: '16px', marginBottom: '2px' }} />
            HYDRO
          </div>
        },
        {
          key: 'landcover',
          element: <div style={{
            width: '70px',
            height: '50px',
            backgroundColor: '#166534',
            border: '2px solid #22c55e',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white',
            cursor: 'pointer'
          }}>
            <i className="fg-landcover-map" style={{ fontSize: '16px', marginBottom: '2px' }} />
            LAND
          </div>
        },
        {
          key: 'contour',
          element: <div style={{
            width: '70px',
            height: '50px',
            backgroundColor: '#92400e',
            border: '2px solid #f59e0b',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white',
            cursor: 'pointer'
          }}>
            <i className="fg-contour-map" style={{ fontSize: '16px', marginBottom: '2px' }} />
            TOPO
          </div>
        }
      ],
      onSelect: (option, index) => console.log('Capa temática seleccionada:', option.key)
    },
    
    // Herramientas regulares
    { 
      key: 'zoom-extent', 
      type: 'tool', 
      circular: true,
      icon: <i className="fg-extent" />,
      title: 'Zoom a extensión'
    },
    
    // Switch para capas
    { 
      key: 'layers-visible', 
      type: 'switch', 
      label: 'Capas visibles',
      checked: true,
      onChange: (checked) => console.log('Capas visibles:', checked)
    }
  ],
  size: 'medium',
  selectedTool: null
};