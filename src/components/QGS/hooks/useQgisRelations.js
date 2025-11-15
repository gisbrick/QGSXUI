import { useState, useEffect } from 'react';
import { fetchAllFeatures } from '../../../services/qgisWFSFetcher';

/**
 * Hook personalizado para cargar y gestionar las relaciones del proyecto QGIS
 * Carga los valores de las capas referenciadas para cada relación definida
 * 
 * @param {Object} config - Configuración del proyecto QGIS
 * @param {string} qgsUrl - URL del servicio QGIS
 * @param {string} qgsProjectPath - Ruta del proyecto QGIS
 * @param {string} token - Token de autenticación (opcional)
 * @returns {Object} Objeto con las relaciones cargadas y el estado de carga
 */
export const useQgisRelations = (config, qgsUrl, qgsProjectPath, token) => {
  const [relationsLoaded, setRelationsLoaded] = useState(false);
  const [relations, setRelations] = useState([]);

  useEffect(() => {
    if (!config) {
      return;
    }

    const layersArray = Object.values(config.layers || {});
    const relationPromises = [];

    // Procesar cada relación definida en el proyecto
    for (const relationName in config.relations || {}) {
      const relation = config.relations[relationName];

      // Asociar las capas correctamente
      relation.referencedLayer = layersArray.find(
        layer => layer.id === relation.referencedLayerId
      );
      relation.referencingLayer = layersArray.find(
        layer => layer.id === relation.referencingLayerId
      );

      // Si no se encuentra la capa referenciada, saltar esta relación
      if (!relation.referencingLayer) {
        console.warn('No se encontró la capa referenciada:', relation.referencingLayerId);
        continue;
      }

      // Crear la promesa para cargar los valores de la capa referenciada
      const promise = fetchAllFeatures(
        qgsUrl,
        qgsProjectPath,
        relation.referencingLayer.name,
        '',
        500,
        token
      )
        .then(values => {
          relation.referencingLayerValues = values;
          return relation;
        })
        .catch(error => {
          console.warn(`Error al cargar features de la capa ${relation.referencingLayer.name}:`, error);
          // Retornar relación sin valores en caso de error
          relation.referencingLayerValues = [];
          return relation;
        });

      relationPromises.push(promise);
    }

    // Esperar a que todas las relaciones se carguen
    Promise.all(relationPromises)
      .then(resolvedRelations => {
        setRelations(resolvedRelations);
        setRelationsLoaded(true);
      })
      .catch(error => {
        console.error('Error al cargar relaciones:', error);
        setRelationsLoaded(true); // Marcar como cargado aunque haya errores
      });
  }, [config, qgsUrl, qgsProjectPath, token]);

  return {
    relations,
    relationsLoaded
  };
};

