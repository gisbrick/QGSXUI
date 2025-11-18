import React, { useEffect, useRef, useState, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useMap } from '../MapProvider';
import { QgisConfigContext } from '../../QgisConfigContext';

/**
 * Herramienta para mostrar la ubicación GPS del usuario en el mapa
 * Muestra un marcador con las coordenadas y un círculo de precisión
 */
const ShowLocation = ({ active, onActiveChange }) => {
  const { mapInstance, t, updateGpsLocation, setGpsActiveStatus } = useMap() || {};
  const qgisConfig = useContext(QgisConfigContext);
  const { notificationManager } = qgisConfig || {};
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const centerMarkerRef = useRef(null);
  const layerGroupRef = useRef(null);
  const intervalRef = useRef(null);
  const watchIdRef = useRef(null);
  const [location, setLocation] = useState(null);
  const translate = useMemo(() => (typeof t === 'function' ? t : (key) => key), [t]);

  // Estabilizar funciones del contexto para evitar re-montajes del efecto
  const callbacksRef = useRef({
    updateGpsLocation,
    setGpsActiveStatus,
    onActiveChange,
    notificationManager
  });

  useEffect(() => {
    callbacksRef.current = {
      updateGpsLocation,
      setGpsActiveStatus,
      onActiveChange,
      notificationManager
    };
  }, [updateGpsLocation, setGpsActiveStatus, onActiveChange, notificationManager]);

  const logWithTime = (label, extra = {}) => {
    const now = new Date();
    const time = now.toLocaleTimeString('es-ES', { hour12: false }) + `.${now.getMilliseconds().toString().padStart(3, '0')}`;
    console.log(`[ShowLocation][${time}] ${label}`, extra);
  };

  // Efecto principal: solo depende de mapInstance, active y translate
  useEffect(() => {
    if (!mapInstance || !active) {
      // Limpiar cuando se desactiva
      if (layerGroupRef.current && mapInstance) {
        mapInstance.removeLayer(layerGroupRef.current);
        logWithTime('Capas de localización eliminadas', { reason: 'tool_deactivated' });
      }
      layerGroupRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      centerMarkerRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setLocation(null);
      callbacksRef.current.setGpsActiveStatus && callbacksRef.current.setGpsActiveStatus(false);
      return;
    }

    if (!navigator.geolocation) {
      console.warn('Geolocalización no está disponible en este navegador');
      callbacksRef.current.onActiveChange && callbacksRef.current.onActiveChange(false);
      callbacksRef.current.setGpsActiveStatus && callbacksRef.current.setGpsActiveStatus(false);
      return;
    }

    const map = mapInstance;
    callbacksRef.current.setGpsActiveStatus && callbacksRef.current.setGpsActiveStatus(true);

    // Usar directamente el overlayPane (como en el código de prueba que funciona)
    const overlayPane = map.getPane('overlayPane');
    if (!overlayPane) {
      console.error('[ShowLocation] No se encontró overlayPane en el mapa');
      return;
    }

    // Crear layerGroup una sola vez, sin especificar pane (Leaflet lo pondrá en overlayPane por defecto)
    if (!layerGroupRef.current) {
      layerGroupRef.current = window.L.layerGroup([]).addTo(map);
      console.log('[ShowLocation] LayerGroup creado y añadido al mapa');
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    };

    const updateLocationOnMap = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const latlng = window.L.latLng(latitude, longitude);
      const currentLocation = { lat: latitude, lng: longitude, accuracy };
      console.log('[ShowLocation] Posición recibida', currentLocation);
      setLocation(currentLocation);
      callbacksRef.current.updateGpsLocation && callbacksRef.current.updateGpsLocation(currentLocation);

      if (!layerGroupRef.current) {
        layerGroupRef.current = window.L.layerGroup([]).addTo(map);
        logWithTime('Capas de localización añadidas', { lat: latitude, lng: longitude, accuracy });
      }

      const popupContent = `
        <div style="text-align: center;">
          <strong>${translate('ui.map.yourLocation') || 'Tu ubicación'}</strong><br/>
          ${latitude.toFixed(6)}, ${longitude.toFixed(6)}<br/>
          <small>${translate('ui.map.accuracy') || 'Precisión'}: ${Math.round(accuracy)}m</small>
        </div>`;

      // Actualizar o crear marcador principal
      if (!markerRef.current) {
        markerRef.current = window.L.circleMarker(latlng, {
          radius: 7,
          color: '#0d47a1',
          weight: 3,
          fillColor: '#bbdefb',
          fillOpacity: 1
        })
          .addTo(layerGroupRef.current)
          .bindPopup(popupContent);
      } else {
        markerRef.current.setLatLng(latlng);
        markerRef.current.setPopupContent(popupContent);
      }

      // Actualizar o crear marcador central
      if (!centerMarkerRef.current) {
        centerMarkerRef.current = window.L.circleMarker(latlng, {
          radius: 2,
          color: '#0d47a1',
          weight: 2,
          fillColor: '#0d47a1',
          fillOpacity: 1
        }).addTo(layerGroupRef.current);
      } else {
        centerMarkerRef.current.setLatLng(latlng);
      }

      // Actualizar o crear círculo de precisión
      if (!circleRef.current) {
        circleRef.current = window.L.circle(latlng, {
          radius: accuracy,
          color: '#3388ff',
          fillColor: '#3388ff',
          fillOpacity: 0.2,
          weight: 2,
          dashArray: '5, 5'
        }).addTo(layerGroupRef.current);
        logWithTime('Capas de localización añadidas', { lat: latitude, lng: longitude, accuracy });
      } else {
        circleRef.current.setLatLng(latlng);
        circleRef.current.setRadius(accuracy);
      }

      // Centrar el mapa en la ubicación (solo si está activo)
      if (active) {
        map.setView(latlng, Math.max(map.getZoom(), 15), {
          animate: true,
          duration: 0.5
        });
      }
    };

    const handleError = (error) => {
      console.error('Error de geolocalización:', error);
      let errorMessage = translate('ui.map.locationError') || 'Error al obtener la ubicación';
      let errorTitle = translate('ui.map.locationError') || 'Error de ubicación';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = translate('ui.map.locationPermissionDenied') || 'Permiso de ubicación denegado';
          errorTitle = translate('ui.map.locationPermissionDenied') || 'Permiso denegado';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = translate('ui.map.locationUnavailable') || 'Ubicación no disponible';
          break;
        case error.TIMEOUT:
          errorMessage = translate('ui.map.locationTimeout') || 'Tiempo de espera agotado';
          break;
        default:
          break;
      }

      if (callbacksRef.current.notificationManager?.addError) {
        callbacksRef.current.notificationManager.addError(errorTitle, errorMessage);
      } else if (callbacksRef.current.notificationManager?.addNotification) {
        callbacksRef.current.notificationManager.addNotification({
          title: errorTitle,
          text: errorMessage,
          level: 'error'
        });
      }

      callbacksRef.current.onActiveChange && callbacksRef.current.onActiveChange(false);
      callbacksRef.current.setGpsActiveStatus && callbacksRef.current.setGpsActiveStatus(false);
    };

    const fetchLocation = () => {
      navigator.geolocation.getCurrentPosition(
        updateLocationOnMap,
        handleError,
        geoOptions
      );
    };

    // Obtener posición inicial
    fetchLocation();
    
    // Actualizar cada 5 segundos
    intervalRef.current = setInterval(fetchLocation, 5000);
    
    // También usar watchPosition para actualizaciones inmediatas
    watchIdRef.current = navigator.geolocation.watchPosition(
      updateLocationOnMap,
      handleError,
      geoOptions
    );

    // Cleanup
    return () => {
      if (layerGroupRef.current && map) {
        map.removeLayer(layerGroupRef.current);
        logWithTime('Capas de localización eliminadas', { reason: 'cleanup' });
      }
      layerGroupRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
      centerMarkerRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setLocation(null);
      callbacksRef.current.setGpsActiveStatus && callbacksRef.current.setGpsActiveStatus(false);
    };
  }, [mapInstance, active, translate]); // Solo estas dependencias estables

  return null;
};

ShowLocation.propTypes = {
  active: PropTypes.bool,
  onActiveChange: PropTypes.func
};

export default ShowLocation;
