import React, { useContext, useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import './map.css';
import MapContent from './mapContent';
import { crs25830_IDENA, IDENA_initialZoom, tileLayerIDENA_EXTENDED_PNG, TUDELA_center_coords } from '../../utilities/leaflet_idena_utilities';
import { addLefletControls } from '../../utilities/leaflet_utilities';
import Toolbar from './toolbar/toolbar';
import Geocoder from './geocoder/geocoder';
import { ConfigMapProvider } from '../../context/configMapProvider';
import { MapViewContext } from '../../context/mapViewProvider';
import { FilterFeatureProvider } from '../../context/filterFeaturesProvider';
import Header02 from '../header02';


const Map = () => {

    const { mapView, setMapView } = useContext(MapViewContext)
    const [uid, setUid] = useState(null);

    //const [mapView, setMapView] = useState();

    useEffect(() => {
        let uid = uuid()
        setUid(uid)       
    }, []);

    useEffect(() => {
        if (!uid) return;   
            
        if (mapView) {
            mapView.remove();
        }


        // Crear el mapa y centrarlo en Tudela
        var mapView = window.L.map("map_" + uid, {
            crs: crs25830_IDENA,
            minZoom: 5,
            maxZoom: 13,
            scrollWheelZoom: true,
            bearing: 0,
            //ROTACIÓN
            rotate: true,
            attributionControl: false,
            rotateControl: {
                closeOnZeroBearing: false,
                position: 'topright',
            }
            //scale: idena_scale
        }).setView(TUDELA_center_coords, IDENA_initialZoom); // Coordenadas de Tudela (latitud, longitud)

        //Crea y añade una graphics layer al mapa
        mapView.graphicsLayer = window.L.featureGroup().addTo(mapView);
        mapView.selectionGraphicsLayer = window.L.featureGroup().addTo(mapView);

        //Almacenamos el uid en el propio mapa
        mapView.uid = uid;

        //Almacenamos la extensión inicial
        mapView.initialExtent = mapView.getBounds()

        //Para poder tarastarlo desde fuera
        window.map = mapView;

        mapView.basemap = tileLayerIDENA_EXTENDED_PNG("mapaBaseGris")
        mapView.basemapName = "mapaBaseGris";
        mapView.basemap.addTo(mapView);

        //Añadimos controles de leaflet, luego los ocultaremoms para controlarlos desde nuestra toolbar
        addLefletControls(mapView)

        //Con esto inicamos el estado del mapa, que se usará para iniciar el resto de componentes
        setMapView(mapView);


    }, [uid]);



    return (
        <>
            <FilterFeatureProvider>
                {uid &&
                    <div className='app-container'>                       
                        <Header02 title={"Visor Arqueológico de Tudela"} />
                        <div className='map' id={"map_" + uid}>
                            {mapView && <MapContent></MapContent>}
                            {mapView && <Toolbar></Toolbar>}
                            {mapView && <Geocoder></Geocoder>}
                        </div>
                    </div>
                }
            </FilterFeatureProvider>
        </>
    );
};

export default Map;