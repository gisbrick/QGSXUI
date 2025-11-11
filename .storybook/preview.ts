import type { Preview } from "@storybook/react";
import React from "react";

// Importar estilos CSS necesarios
import 'font-gis/css/font-gis.css';
import '@fortawesome/fontawesome-free/css/all.css';
import '../src/index.css';
// Importar estilos de Leaflet
import '../public/leaflet/leaflet.css';
// Importar sistema de temas (variables CSS)
import '../src/themes/theme.css';

// Extender el tipo Window para incluir Leaflet
declare global {
  interface Window {
    L?: any;
  }
}

// Función para cargar el plugin WMTS
const loadWMTSPlugin = () => {
  if (window.L?.TileLayer?.WMTS) {
    return; // Ya está cargado
  }

  let wmtsScript = document.querySelector('script[data-wmts-plugin]') as HTMLScriptElement | null;
  
  if (!wmtsScript) {
    wmtsScript = document.createElement('script') as HTMLScriptElement;
    wmtsScript.setAttribute('data-wmts-plugin', 'true');
    wmtsScript.async = false;
    
    // Cargar desde public/leaflet (accesible desde Storybook)
    wmtsScript.src = '/leaflet/leaflet.wmts.js';
    
    wmtsScript.onerror = () => {
      console.warn('No se pudo cargar el plugin WMTS. El mapa usará WMS como fallback para capas WMTS.');
    };
    
    document.head.appendChild(wmtsScript);
  }
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    options: {
      storySort: {
        order: [
          
          '01 - QGS',
          '02 - UI-QGS',
          '03 - UI-QGS-Form-Controls',
          '04 - UI',
          'Otros'
        ],
      },
    },
  },
  decorators: [
    (Story) => {
      React.useEffect(() => {
        // Cargar Leaflet si no está disponible
        if (typeof window !== 'undefined' && !window.L) {
          const existingScript = document.querySelector('script[src="/leaflet/leaflet.js"]');
          if (!existingScript) {
            const script = document.createElement('script');
            script.src = '/leaflet/leaflet.js';
            script.async = false;
            script.onload = () => {
              console.log('Leaflet cargado correctamente');
              // Cargar plugin WMTS después de Leaflet
              loadWMTSPlugin();
            };
            script.onerror = () => {
              console.error('Error al cargar Leaflet');
            };
  document.head.appendChild(script);
          } else if (window.L && !window.L.TileLayer?.WMTS) {
            // Si Leaflet ya está cargado pero falta WMTS
            loadWMTSPlugin();
          }
        }
      }, []);
      return React.createElement(Story);
    },
  ],
};

export default preview;
