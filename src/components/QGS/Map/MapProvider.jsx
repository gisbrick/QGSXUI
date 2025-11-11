import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { QgisConfigContext } from '../QgisConfigContext';

// Creamos un contexto para compartir estado entre componentes
const MapContext = createContext(null);

export const MapProvider = ({ layerName, featureId, children }) => {
  const mapInstanceRef = useRef(null);
  const initialBoundsRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);

  // Obtener configuración QGIS y función de traducción del contexto
  const qgisConfig = useContext(QgisConfigContext);
  const { config, t, notificationManager, qgsUrl, qgsProjectPath } = qgisConfig || {};

  useEffect(() => {
    // Inicialización si es necesaria
  }, []);

  const value = {
    mapInstance,
    setMapInstance,
    mapInstanceRef,
    initialBoundsRef,
    layerName,
    featureId,
    config,
    t,
    notificationManager,
    qgsUrl,
    qgsProjectPath
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

// Hook para acceder fácilmente al contexto
export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    console.warn('useMap debe usarse dentro de un MapProvider');
    return {};
  }
  return context;
};

// Export default para compatibilidad con index.js
export default MapProvider;