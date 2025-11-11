import React, { useEffect, useRef, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { useMap } from '../MapProvider';
import { QgisConfigContext } from '../../QgisConfigContext';

/**
 * Herramienta para mostrar la ubicación GPS del usuario en el mapa
 * Muestra un marcador con las coordenadas y un círculo de precisión
 */
const ShowLocation = ({ active, onActiveChange }) => {
  const { mapInstance, t } = useMap() || {};
  const qgisConfig = useContext(QgisConfigContext);
  const { notificationManager } = qgisConfig || {};
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const watchIdRef = useRef(null);
  const [location, setLocation] = useState(null);
  const translate = typeof t === 'function' ? t : (key) => key;

  useEffect(() => {
    if (!mapInstance || !active) {
      // Limpiar cuando se desactiva
      if (markerRef.current) {
        mapInstance.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (circleRef.current) {
        mapInstance.removeLayer(circleRef.current);
        circleRef.current = null;
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setLocation(null);
      return;
    }

    const map = mapInstance;

    // Verificar si la geolocalización está disponible
    if (!navigator.geolocation) {
      console.warn('Geolocalización no está disponible en este navegador');
      if (onActiveChange) {
        onActiveChange(false);
      }
      return;
    }

    // Función para actualizar la posición en el mapa
    const updateLocation = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      
      const latlng = window.L.latLng(latitude, longitude);
      setLocation({ lat: latitude, lng: longitude, accuracy });

      // Eliminar marcador y círculo anteriores si existen
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
      }

      // Crear marcador con icono personalizado
      const icon = window.L.divIcon({
        className: 'gps-marker',
        html: '<i class="fg-location" style="font-size: 24px; color: #3388ff;"></i>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      markerRef.current = window.L.marker(latlng, { icon })
        .addTo(map)
        .bindPopup(
          `<div style="text-align: center;">
            <strong>${translate('ui.map.yourLocation') || 'Tu ubicación'}</strong><br/>
            ${latitude.toFixed(6)}, ${longitude.toFixed(6)}<br/>
            <small>${translate('ui.map.accuracy') || 'Precisión'}: ${Math.round(accuracy)}m</small>
          </div>`
        );

      // Crear círculo de precisión
      circleRef.current = window.L.circle(latlng, {
        radius: accuracy,
        color: '#3388ff',
        fillColor: '#3388ff',
        fillOpacity: 0.2,
        weight: 2,
        dashArray: '5, 5'
      }).addTo(map);

      // Centrar el mapa en la ubicación (solo la primera vez)
      if (!location) {
        map.setView(latlng, Math.max(map.getZoom(), 15), {
          animate: true,
          duration: 0.5
        });
      }
    };

    // Función para manejar errores de geolocalización
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
      }

      // Mostrar error usando notificationManager
      if (notificationManager && notificationManager.addError) {
        notificationManager.addError(errorTitle, errorMessage);
      } else if (notificationManager && notificationManager.addNotification) {
        notificationManager.addNotification({
          title: errorTitle,
          text: errorMessage,
          level: 'error'
        });
      }
      
      if (onActiveChange) {
        onActiveChange(false);
      }
    };

    // Opciones para geolocalización
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    // Obtener posición inicial
    navigator.geolocation.getCurrentPosition(updateLocation, handleError, options);

    // Observar cambios de posición
    watchIdRef.current = navigator.geolocation.watchPosition(updateLocation, handleError, options);

    // Cleanup
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setLocation(null);
    };
  }, [mapInstance, active, translate, onActiveChange, location]);

  return null;
};

ShowLocation.propTypes = {
  active: PropTypes.bool,
  onActiveChange: PropTypes.func
};

export default ShowLocation;

