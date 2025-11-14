import type { Preview } from "@storybook/react";
import React from "react";

// Importar estilos CSS necesarios
import 'font-gis/css/font-gis.css';
import '@fortawesome/fontawesome-free/css/all.css';
import '../src/index.css';
// Importar estilos de Leaflet
// Nota: Los archivos en public/ se sirven desde la raíz, así que usamos la ruta absoluta
// Para Storybook, cargamos el CSS dinámicamente ya que no se puede importar directamente
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

// Función para cargar el plugin de medición
const loadMeasurePlugin = () => {
  if (window.L?.MeasureAction) {
    return; // Ya está cargado
  }

  let measureScript = document.querySelector('script[data-measure-plugin]') as HTMLScriptElement | null;
  
  if (!measureScript) {
    measureScript = document.createElement('script') as HTMLScriptElement;
    measureScript.setAttribute('data-measure-plugin', 'true');
    measureScript.async = false;
    
    // Cargar desde public/leaflet (si está disponible) o desde vendor
    // Primero intentamos desde public, luego desde vendor
    const tryLoadMeasure = (path) => {
      measureScript.src = path;
      measureScript.onload = () => {
        console.log('Plugin de medición cargado correctamente');
        // Cargar CSS después de cargar el JS
        let measureCSS = document.querySelector('link[data-measure-css]') as HTMLLinkElement | null;
        if (!measureCSS) {
          measureCSS = document.createElement('link');
          measureCSS.setAttribute('data-measure-css', 'true');
          measureCSS.rel = 'stylesheet';
          // Intentar cargar CSS desde la misma ubicación
          const cssPath = path.replace('.js', '.css');
          measureCSS.href = cssPath;
          measureCSS.onerror = () => {
            console.warn('No se pudo cargar el CSS del plugin de medición.');
          };
          document.head.appendChild(measureCSS);
        }
      };
      measureScript.onerror = () => {
        // Si falla desde public, intentar desde vendor (solo en desarrollo)
        if (path.startsWith('/leaflet/')) {
          console.warn('No se encontró el plugin de medición en public. Las herramientas de medición pueden no estar disponibles.');
        }
      };
    };
    
    // Intentar cargar desde public/leaflet primero
    tryLoadMeasure('/leaflet/leaflet.measure.js');
    
    document.head.appendChild(measureScript);
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
        // Cargar CSS de Leaflet dinámicamente
        if (typeof document !== 'undefined') {
          const existingLink = document.querySelector('link[data-leaflet-css]');
          if (!existingLink) {
            const link = document.createElement('link');
            link.setAttribute('data-leaflet-css', 'true');
            link.rel = 'stylesheet';
            link.href = '/leaflet/leaflet.css';
            document.head.appendChild(link);
          }
        }
        
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
              // Cargar plugin de medición después de Leaflet
              loadMeasurePlugin();
            };
            script.onerror = () => {
              console.error('Error al cargar Leaflet');
            };
  document.head.appendChild(script);
          } else if (window.L) {
            // Si Leaflet ya está cargado, cargar plugins si faltan
            if (!window.L.TileLayer?.WMTS) {
              loadWMTSPlugin();
            }
            if (!window.L.MeasureAction) {
              loadMeasurePlugin();
            }
          }
        }
      }, []);
      return React.createElement(Story);
    },
  ],
};

export default preview;
