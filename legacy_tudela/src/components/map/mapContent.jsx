import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from "react-router-dom";

import { getMapLeafletScale } from '../../utilities/leaflet_utilities';
import Handlebars from "handlebars";
import './mapContent.css';
import { Button } from 'antd';
import { ConfigMapContext } from '../../context/configMapProvider';
import { MapViewContext } from '../../context/mapViewProvider';
import { FilterFeatureContext } from '../../context/filterFeaturesProvider';
import { Link } from "react-router"

const MapContent = () => {

    const [searchParams] = useSearchParams();


    const { mapView, addLayerToMapView } = useContext(MapViewContext)

    const { loading, config, setConfig, dataPath } = useContext(ConfigMapContext)

    const { filters } = useContext(FilterFeatureContext)

    if (mapView === undefined) {
        throw new Error("mapView undefined: ", mapView)
    }

    if (config === undefined) {
        throw new Error("config undefined: ", config)
    }

    if (mapView === undefined) {
        throw new Error("mapView undefined: ", mapView)
    }

    const loadGeoJsonLayers = async (config) => {
        //console.log("loadGeoJsonLayers", config)
        for (const layer of [...config.layers].reverse()) {

            let geoJsonData = null
            let sldData = null
            let template = null

            // Cargar el GeoJSON       
            if (layer.geojson) {
                const geoJsonResponse = await fetch(`${dataPath}/${layer.geojson}`);
                geoJsonData = await geoJsonResponse.json()
            }


            // Cargar el SLD
            if (layer.sld) {
                const sldResponse = await fetch(`${dataPath}/${layer.sld}`);
                sldData = await sldResponse.text()
            }

            if (layer.popup) {
                const templateResponse = await fetch(`${TEMPLATES}/${layer.popup}`)
                template = await templateResponse.text()
            }

            // Crear un estilizador SLD
            var SLDStyler = sldData ? new window.L.SLDStyler(sldData) : null;
            const labelValues = configLabels(SLDStyler, sldData)
            addGeoJSONDataToMap(geoJsonData, SLDStyler, layer, template, labelValues)
        }
    }

    const zoomToIntervencion = async (id, i) => {
        const listLayerName = "Intervenciones";


        const mapLayer = mapView._layers && Object.values(mapView._layers).find(layer => layer.name === listLayerName);
        if (!mapLayer && i < 20) {
            setTimeout(() => {
                zoomToIntervencion(id, ++i)
            }, 100);
        }
        else {
            const layerIntervenciones = mapLayer._layers && Object.values(mapLayer._layers)[0]; // Access the first key

            Object.keys(layerIntervenciones._layers).forEach((key, index) => {
                const layer = layerIntervenciones._layers[key];
                if (layer.feature.properties["numero_int"] == id) {
                    //Realizar zoom
                    //mapView.fitBounds(layer.getBounds())
                    mapView.flyToBounds(layer.getBounds())
                    //Resetea la layer de gráficos
                    if (!mapView.selectionGraphicsLayer) {
                        mapView.selectionGraphicsLayer = window.L.featureGroup().addTo(mapView);
                    }
                    else {
                        mapView.selectionGraphicsLayer.clearLayers();
                    }
                    //Inicia y añade la geometría
                    const selectedLayer = window.L.geoJSON(layer.toGeoJSON(), {
                        style: {
                            color: 'red',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.5
                        }

                    });
                    mapView.selectionGraphicsLayer.addLayer(selectedLayer)

                    // Copia el popup de layer
                    if (layer.getPopup()) {
                        selectedLayer.bindPopup(layer.getPopup().getContent());
                    }

                    if (layer.popupContent) {
                        // Mostrar popup en el centro de la geometría con el contenido de layer.popupContent
                        selectedLayer.bindPopup(layer.popupContent);
                    }

                }
            });
        }
    }

    const configLabels = (SLDStyler, sldData) => {
        let fieldName, fontFamily, fontSize, textColor, haloColor, haloRadius;
        if (SLDStyler) {

            // Pasamos el SLD a XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(sldData, "application/xml");

            // Buscar el TextSymbolizer
            const textSymbolizer = xmlDoc.querySelector("se\\:TextSymbolizer, TextSymbolizer");

            if (textSymbolizer) {
                // Extraer el campo a etiquetar (ogc:PropertyName)
                const propertyNameNode = textSymbolizer.querySelector("ogc\\:PropertyName, PropertyName");
                fieldName = propertyNameNode ? propertyNameNode.textContent : null;

                // Extraer estilos (se:Font, se:Fill, etc.)
                fontFamily = textSymbolizer.getElementsByTagNameNS("http://www.opengis.net/se", "SvgParameter")[0].textContent;

                const fontNode = textSymbolizer.querySelector("se\\:Font, Font");
                if (fontNode) {
                    const fontFamilyNode = fontNode.querySelector("se\\:SvgParameter[name='font-family'], SvgParameter[name='font-family']");
                    fontFamily = fontFamilyNode ? fontFamilyNode.textContent : 'Arial';

                    const fontSizeNode = fontNode.querySelector("se\\:SvgParameter[name='font-size'], SvgParameter[name='font-size']");
                    fontSize = fontSizeNode ? fontSizeNode.textContent : '12';
                }

                const haloNode = textSymbolizer.querySelector("se\\:Halo, Halo");
                if (haloNode) {
                    const haloColorNode = haloNode.querySelector("se\\:Fill > se\\:SvgParameter[name='fill'], SvgParameter[name='fill']");
                    haloColor = haloColorNode ? haloColorNode.textContent : '#FFFFFF';

                    const haloRadiusNode = haloNode.querySelector("se\\:Radius, Radius");
                    haloRadius = haloRadiusNode ? haloRadiusNode.textContent : '1';
                }

                const fillNode = Array.from(textSymbolizer.querySelectorAll("se\\:Fill, Fill")).find(node => node.parentNode === textSymbolizer);
                if (fillNode) {
                    const textColorNode = fillNode.querySelector("se\\:SvgParameter[name='fill'], SvgParameter[name='fill']");
                    textColor = textColorNode ? textColorNode.textContent : '#000000';
                }
            }
        }
        return { fieldName, fontFamily, fontSize, textColor, haloColor, haloRadius }
    }

    const addGeoJSONDataToMap = (geoJsonData, SLDStyler, layer, template, labelValues) => {
        let i = 0;
        const theMarkers = window.L.layerGroup()
        const { fieldName, fontFamily, fontSize, textColor, haloColor, haloRadius } = labelValues
        //console.log("entra", theMarkers, markers)
        const geoJsonLayer = window.L.geoJSON(geoJsonData, {
            style: SLDStyler ? SLDStyler.getStyleFunction() : null,
            pointToLayer: SLDStyler ? SLDStyler.getPointToLayerFunction() : null,
            //Se pueden añadir filtros
            filter: (feature, ly) => {
                let flag = true
                //console.log("layerName", layer.name)
                //console.log("field", feature.properties[filters.fieldToCheck], filters.arrayWithValuesOfExcludedFeatures.includes(feature.properties[filters.fieldToCheck]))
                if (filters.layerName.includes(layer.name)) {
                    if (filters.arrayWithValuesOfExcludedFeatures.includes(feature.properties[filters.fieldToCheck])) {
                        flag = false
                    }
                }
                return flag
            },
            onEachFeature: function (feature, ly) {              
                // Añadimos popup
                if (feature.properties) {
                    let popupContent = ""

                    if (layer.popup) {
                        let name = layer.name.toLowerCase().replaceAll(" ", "_")
                        //console.log(name)
                        //TODO- Este url solo debería ser añadido para aquellos popups que abren una ficha
                        let url = `<a href="#/ficha/${name}/${feature.properties.numero_int}" target="_blank">Abrir ficha</a>`;
                        feature.properties["url"] = url

                        const templateFunc = Handlebars.compile(template);
                        popupContent = templateFunc(feature.properties)

                    }
                    ly.popupContent = popupContent;

                    // Controlar el evento click en la feature
                    ly.on('click', function (e) {
                        if (mapView.selectedTool) {
                            //Si tenemos una herramienta seleccionada, no mostramos popups, y damos prioridad a la acción de la herramienta seleccionada
                            ly.unbindPopup();
                        } else {
                            //Vinculamos y abrimos el popup
                            ly.bindPopup(popupContent);
                            ly.openPopup(e.latlng);

                            // Captura el evento de cierre del popup
                            ly.getPopup().on('remove', function () {
                                if (mapView.selectionGraphicsLayer) {
                                    mapView.selectionGraphicsLayer.clearLayers();
                                }
                            });

                            //Resetea la layer de gráficos
                            if (!mapView.selectionGraphicsLayer) {
                                mapView.selectionGraphicsLayer = window.L.featureGroup().addTo(mapView);
                            }
                            else {
                                mapView.selectionGraphicsLayer.clearLayers();
                            }
                            //Inicia y añade la geometría
                            const selectedLayer = window.L.geoJSON(ly.toGeoJSON(), {
                                style: {
                                    color: 'red',
                                    weight: 2,
                                    opacity: 1,
                                    fillOpacity: 0.5
                                }
                            });
                            mapView.selectionGraphicsLayer.addLayer(selectedLayer);
                        }
                    });
                }

                if (fieldName && feature.properties && feature.properties[fieldName]) {
                    const label = window.L.divIcon({
                        className: 'custom-label',


                        html: `<span style="
                                font-family: ${fontFamily};
                                font-size: ${fontSize}px;
                                color: ${textColor};
                                text-shadow: -1px -1px ${haloRadius}px ${haloColor}, 
                                             1px -1px ${haloRadius}px ${haloColor}, 
                                            -1px 1px ${haloRadius}px ${haloColor}, 
                                            1px 1px ${haloRadius}px ${haloColor};
                              ">${feature.properties[fieldName]}</span>`

                    });



                    // Añadir la etiqueta al mapa como un marcador

                    let center;
                    if (ly.getBounds) {
                        center = ly.getBounds().getCenter(); // For polygons and lines
                    } else if (ly.feature && ly.feature.geometry && ly.feature.geometry.type === "Point") {
                        center = window.L.latLng(ly.feature.geometry.coordinates[1], ly.feature.geometry.coordinates[0]); // For points
                    } else {
                        console.warn("Unable to determine center for layer:", ly);
                        return;
                    }
                    const marker = window.L.marker(center, { icon: label });
                    marker.originPosition = center;
                    //console.log("marker", marker)

                    //Evaluamos si tenemos que añadir la etiqueta al mapa o no, en base a escala en base a filtros

                    // Function to update marker visibility based on zoom level
                    const updateMarkerVisibility = () => {
                        const currentZoom = getMapLeafletScale(mapView)//mapView.getZoom();


                        const adjustedLat = marker.originPosition.lat + (0.00000004 * currentZoom); // Adjust vertically based on scale
                        const adjustedLng = marker.originPosition.lng + (0.00000004 * currentZoom); // Adjust horizontally based on scale
                        marker.setLatLng([adjustedLat, adjustedLng]);

                        if (layer.view_labels_scales) {
                            const minZoom = layer.view_labels_scales.min; // Set your minimum zoom level here
                            const maxZoom = layer.view_labels_scales.max; // Set your maximum zoom level here
                            //Evaluamos si tenemos que añadir la etiqueta al mapa o no, en base a escala
                            if ((currentZoom >= minZoom && currentZoom <= maxZoom)) {

                                marker.addTo(theMarkers);
                            } else {
                                theMarkers.removeLayer(marker);
                            }
                        }
                    };


                    if ((!filters.layerName.includes(layer.name)
                        || !filters.arrayWithValuesOfExcludedFeatures.includes(feature.properties[filters.fieldToCheck]))) {

                        theMarkers.addLayer(marker)


                        // Add the marker to the map
                        //marker.addTo(mapView);
                        //console.log("mapview", mapView)


                        // Update marker visibility initially
                        updateMarkerVisibility();

                    }

                    // Update marker visibility on zoom end
                    mapView.on('zoomend', updateMarkerVisibility);
                }
            }

        });


        ++i;

        //
        const groupLayer = window.L.layerGroup([geoJsonLayer, theMarkers]);
        groupLayer.name = layer.name;
        addLayerToMapView(layer.name, layer.visible, groupLayer);
        //addMarkersToMapView(theMarkers)          


    }



    // Escuchar el evento 'click' en el mapa para gestioner los popups, en caso de que tengamos capas GeoJSON superiores sin popups
    mapView.on('click', function (e) {
        // Variable para controlar si se encontró un popup
        var popupFound = false;
        if (mapView.selectedTool != null) {
            //Si tenemos una herramienta seleccionada, no mostramos popups, y damos prioridad a la acción de la herramienta seleccionada  
        }
        else {
            mapView.eachLayer(function (layer) {
                // Comprobar si la capa tiene la función 'getBounds' o es un GeoJSON con popups
                if (layer instanceof window.L.GeoJSON) {
                    layer.eachLayer(function (subLayer) {
                        if (subLayer.getBounds && subLayer.getBounds().contains(e.latlng)) {
                            if (!popupFound && subLayer.getPopup()) { // Si tiene popup, mostrarlo    
                                /*                      
                          let popup = subLayer.openPopup(e.latlng);
                          popupFound = true;
    
                          //Captura el evento de cierre del popup
                          subLayer.getPopup().on('remove', function () {
                              console.log('Popup closed');
                              if (mapView.selectionGraphicsLayer) {
                                  mapView.selectionGraphicsLayer.clearLayers();
                              }
                              else{
                                  mapView.selectionGraphicsLayer = window.L.featureGroup().addTo(mapView);
                              }
                          });
    
    
                          //Añade la geometría al map
                          if(!mapView.selectionGraphicsLayer){
                              console.log('Añade la layer selectionGraphicsLayer');
                              mapView.selectionGraphicsLayer = window.L.featureGroup().addTo(mapView);
                          }
                          else{
                              console.log('Limpia la layer selectionGraphicsLayer');
                              mapView.selectionGraphicsLayer.clearLayers();
                          }
                  
                         
                          const selectedLayer = window.L.geoJSON(subLayer.toGeoJSON(), {
                              style: {
                                  color: 'red',
                                  weight: 2,
                                  opacity: 1,
                                  fillOpacity: 0.5
                              }
                          });
                          mapView.selectionGraphicsLayer.addLayer(selectedLayer);
                          */

                            }
                        }
                    });
                }
            })
        }
    }
    );


    useEffect(() => {        
        
        if (!loading) {
          
            loadGeoJsonLayers(config);


            const idIntervencion = searchParams.get("idIntervencion"); // Recupera el valor

            if (idIntervencion) {
                setTimeout(() => {
                    zoomToIntervencion(idIntervencion, 0)
                }, 100);
            }
        }
    }, [config, filters]);

    return (
        <></>
    );
};

export default MapContent;