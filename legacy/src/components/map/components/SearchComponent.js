import { Space, Input } from "antd";
import { useEffect, useState } from "react";
import i18next, { i18n } from "i18next";
import { OpenStreetMapService } from "../../../service/openStreetMapService";
import ListaDirecciones from "./ListaDirecciones";


const { Search } = Input;

const SearchComponent = ({ mapView, BUSCADOR }) => {

    const [error, setError] = useState(false)
    const [layer, setLayer] = useState(undefined)
    const [places, setPlaces] = useState([])
    const [mostrarLista, setMostrarLista] = useState(false)
    const [bounds, setBounds] = useState()
    const [searchValue, setSearchValue] = useState()

    /**
     * Función que iguala la extensión del mapa a la de la feature recuperada en la búsqueda de direcciones.
     * Se realiza zoom automáticamente
     * 
     * @param {*} feature 
     */
    let zoom = (feature) => {
        let featureBounds;
        if (feature.boundingbox) {
            featureBounds = window.L.latLngBounds([
                [feature.boundingbox[1], feature.boundingbox[2]],
                [feature.boundingbox[0], feature.boundingbox[3]]
            ]);
        }
        else {
            console.log("otra opcion")
        }
        mapView.fitBounds(featureBounds);
    }

    /**
     * Función que pinta la feature en el mapa, si no existe ya.
     * Si ya existe entonces no la pinta.
     * 
     * @param {*} feature 
     */
    const dibujarEntidad = (feature) => {
        //comprobar que existe geojson
        if (feature.geojson) {
            let geojson = feature.geojson
            if (layer) {
                layer.remove()
            }
            let layerCopy = window.L.geoJSON(geojson, {
                style: {
                    color: 'red',
                    //weight: 2
                }
            }).addTo(mapView);

            layerCopy.bindTooltip(feature.name).openTooltip()

            setLayer(layerCopy)
        }
    }

    const parseToViewBoxExtent = (extent) => {
        //parse from _northEast, _southWest to viewBox extent
        if (extent._northEast && extent._southWest) {
            let { _northEast, _southWest } = extent
            let viewBox = `${_southWest.lng},${_southWest.lat},${_northEast.lng},${_northEast.lat}`
            return viewBox;
        }
        //parse from xMax, yMax, xMin, yMin to viewBox extent
        else if (extent.xMaximum && extent.yMaximum && extent.xMinimum && extent.yMinimum) {
            let { xMaximum, yMaximum, xMinimum, yMinimum } = extent
            let viewBox = `${xMinimum},${yMaximum},${xMaximum},${yMinimum}`
            return viewBox;
        } else {
            console.log("añadir otros")
        }
    }

    /**
     * si el valor que entra es vacio entonces se elimina la lista y no se busca nada
     * si hay valor entonces se realiza la busqueda y se muestran los resultados en la lista
     * @param {*} value 
     */
    const onSearch = (value) => {

        let direccion;
        let nucleo;
        let viewBox;

        if (value != "") {
            direccion = value
            nucleo = BUSCADOR.LocationFilter ? BUSCADOR.LocationFilter : ""
            viewBox = BUSCADOR.LocationExtent ? parseToViewBoxExtent(BUSCADOR.LocationExtent) : parseToViewBoxExtent(bounds)

            let params = {
                direccion,
                nucleo,
                viewBox
            }
            OpenStreetMapService.GETSEARCH(params)
                .then((data) => {

                    //funcion que gestiona los resultados recuperados
                    gestionarData(data)

                })
                .catch((error) => {
                    console.log("error en fetch", error)
                    setError(true)
                })
        } else {
            //esconder lista
            setMostrarLista(false)
            setPlaces([])
        }

    }

    /**
     * Si no hay resultados entonces se pasa el mensaje a la lista
     * Si solo hay un resultado entonces no se muestra la lista y se pinta directamente en el mapa.
     * Si hay más de un resultado entonces se muestran en la lista
     * 
     * @param {*} data 
     */

    const gestionarData = (data) => {
        //Quitamos de los resultados lo que no sea calle o dirección
        let dataAux = []
        for (let i in data) {
            if(data[i].class.includes("highway") || data[i].class.includes("place")){
                dataAux.push(data[i]);
            }
        }

        if (dataAux.length == 0) {          
            setPlaces([{ display_name: i18next.t('common.tools.searcher.msg') }])
            setMostrarLista(true)
        } else if (dataAux.length == 1) {
            fijarEntidadMapa(dataAux[0])
        } else {
            setPlaces(dataAux)
            setMostrarLista(true)
        }
    }

    /**
     * Función que actúa cuando una entidad de la lista es seleccionada.
     * 
     * @param {*} feature 
     */
    const fijarEntidadMapa = (feature) => {
        mapView.dragging.enable(); 
        mapView.scrollWheelZoom.enable();

        setSearchValue(feature.display_name)
        zoom(feature)
        dibujarEntidad(feature)
        setMostrarLista(false)
    }

    useEffect(() => {
        if (mapView) {
            setBounds(mapView.getBounds())
        }
    }, [mapView])


    return (
        <>
            <Space direction="vertical">
                <Search 
                placeholder={i18next.t('common.tools.searcher.placeholder')}
                allowClear
                onChange={(e)=> {if(e.target.value==""){layer.remove()}}}
                onSearch={onSearch} 
                style={{ width: 200 }} />
                {mostrarLista && <ListaDirecciones cities={places} fijarEntidadMapa={fijarEntidadMapa} mapView={mapView}/>}
            </Space>
        </>
    )
};
export default SearchComponent;