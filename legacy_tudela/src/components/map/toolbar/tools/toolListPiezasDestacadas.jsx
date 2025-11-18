import { Button, Card, Drawer, Input, Select, Tooltip } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import Handlebars from "handlebars";
import 'font-gis/css/font-gis.css';
import { MapViewContext } from '../../../../context/mapViewProvider';
import { ConfigMapContext } from '../../../../context/configMapProvider';

const ToolListPiezasDestacadas = () => {
    const { mapView } = useContext(MapViewContext)
    const [showDrawer, setShowDrawer] = React.useState();

    return (
        <>
            <Tooltip title={"Lista de piezas destacadas"}>
                <Button type="primary" shape="circle" size='large'
                    onMouseOver={(e) => window.mouseOverButton = true}
                    onMouseOut={(e) => window.mouseOverButton = false}
                    onClick={() => setShowDrawer(true)}>
                    {<i className="fa fa-star"></i>}
                </Button>
            </Tooltip>
            <Drawer
                title="Lista de piezas destacadas"
                placement="right"
                onMouseOver={(e) => window.mouseOverButton = true}
                onMouseOut={(e) => window.mouseOverButton = false}
                closable={true}
                onClose={() => {
                    setShowDrawer(false);
                    if (mapView.selectionGraphicsLayer) {
                        mapView.selectionGraphicsLayer.clearLayers();
                    }
                }}
                open={showDrawer}
                width={400}>
                {showDrawer && <ListContent mapView={mapView}></ListContent>}
            </Drawer>
        </>

    );
}

export default ToolListPiezasDestacadas;

const ListContent = ({ mapView }) => {

    const { dataPath } = useContext(ConfigMapContext)

    const [searchTerm, setSearchTerm] = useState('');
    const [piezasDestacadas, setPiezasDestacadas] = useState([])
    const [piezasDestacadasFiltradas, setPiezasDestacadasFiltradas] = useState([])
    const [dataCronologia, setDataCronologia] = useState([])
    const [filtroCronologia, setFiltroCronologia] = useState(null)

    const listLayerName = "Intervenciones";
    const piezasDestacadasLayerName = "Piezas destacadas.geojson"
    const cronologiaLayerName = "Cronología de piezas destacadas.geojson"
    const templateNamePiezaDestacada = "popupPiezaDest.hbs"

    const getPiezasDestacadas = async () => {
        const response = await fetch(`${dataPath}/${piezasDestacadasLayerName}`);
        const geojsonData = await response.json();
        return geojsonData;
    }

    const getCronologia = async () => {
        const response = await fetch(`${dataPath}/${cronologiaLayerName}`);
        const geojsonData = await response.json();
        return geojsonData;
    }

    const getTemplatePiezaDestacada = async () => {
        const templateResponse = await fetch(`${TEMPLATES}/${templateNamePiezaDestacada}`)
        const template = await templateResponse.text()
        return template
    }

    const getCronologiaOptions = (data) => {
        return data.map((feature) => { return { "value": feature.properties.cod_crono, "label": feature.properties.nom_crono } })
    }


    /**
     * - Cargar todas las piezas destacadas
     * - Cargar plantilla de piezas destacadas
     * - Cargar valores de cronología
     * - Filtar las piezas destacas en función a las intervenciones que se ven en el mapa
     * - Mostrar la lista de piezas destacas
     */
    const mount = async () => {

        await Promise.all([getPiezasDestacadas(), getCronologia(), getTemplatePiezaDestacada()])
            .then((values) => {
                let piezasDestacadasAux = values[0]?.features
                let cronologia = values[1]?.features
                let template = values[2]

                const mapLayer = mapView._layers && Object.values(mapView._layers).find(layer => layer.name === listLayerName);

                const layerIntervenciones = mapLayer._layers && Object.values(mapLayer._layers)[0]; // Access the first key

                const filteredLayers = mapLayer ? Object.keys(layerIntervenciones._layers).map(key => {
                    const layer = layerIntervenciones._layers[key];
                    return layer
                }) : [];

                //filtrar las piezas destacadas en función de las intervenciones que se visualizan en el mapa
                //asociar la pieza destacada con su layer
                /* 
                TODO ESTO HAY QUE MIRAR DE CAMBIARLO PORQUE HACERLO ASÍ NO ES VIABLE YA QUE TENDRÏAMOS QUE ITERAR POR CADA PIEZA (hay 300) TODAS LAS INTERVENCIONES (HAY 90). NO PUEDE SER ASÍ
                HABRÁ QUE RECUPERAR LA PIEZA CUANDO SE HAGA ZOOM EN LA INTERVENCIÓN Y NO CARGARLAS TODAS AL INICIO
                */
                piezasDestacadasAux = piezasDestacadasAux.filter((pieza) => {
                    const dato = filteredLayers.find((layer) => layer.feature.properties.numero_int == pieza.properties.numero_int)
                    return dato
                }).map((pieza) => {
                    const dato = filteredLayers.find((layer) => layer.feature.properties.numero_int == pieza.properties.numero_int)
                    pieza["layer"] = dato
                    let url = `<a href="#/fichaPiezaDestacada/${pieza.properties.num_pieza}" target="_blank">Abrir ficha</a>`;
                    pieza.properties.url = url
                    const templateFunc = Handlebars.compile(template);
                    const content = templateFunc(pieza.properties)
                    pieza["template"] = content
                    return pieza
                })

                //Asociar la cronología al select
                setDataCronologia(cronologia ? getCronologiaOptions(cronologia) : [])

                setPiezasDestacadas(piezasDestacadasAux)
                setPiezasDestacadasFiltradas(piezasDestacadasAux)
            })
            .catch((error) => {
                console.log("error ", error)
            })
    }

    useEffect(() => {
        mount()
    }, [])

    useEffect(() => {
        const data = piezasDestacadas.filter((pieza) =>
            pieza.template &&
            pieza.template.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (!filtroCronologia || pieza.properties.cronologia == filtroCronologia)
        )
        setPiezasDestacadasFiltradas(data)
    }, [searchTerm, filtroCronologia])

    return (
        <>
            <Input.Search
                type="text"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value)
                }}
                onSearch={() => { }}
                placeholder="Buscar..."
                onClear={(e) => {
                    setSearchTerm('')
                }}
                allowClear
                style={{ marginBottom: '10px', width: '100%' }}
            />

            <Select
                placeholder="Cronología"
                options={dataCronologia}
                allowClear
                onChange={(e) => { setFiltroCronologia(e) }}
                style={{ marginBottom: '10px', width: '100%' }}>
            </Select>

            {piezasDestacadasFiltradas.length > 0 && piezasDestacadasFiltradas.map((value, index) => {
                const layer = value.layer;
                return (
                    <div key={index} style={{ marginBottom: '5px' }}>
                        <Card
                            size="small"
                            title={
                                <>
                                    <i className="fg fg-flag" style={{ color: 'black', fontSize: '12px' }}></i>
                                </>
                            }
                            extra={
                                <div style={{ "padding": '5px', display: 'flex', gap: '10px' }}>
                                    <a onClick={() => {
                                        //Realizar zoom
                                        mapView.fitBounds(layer.getBounds())
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
                                        mapView.selectionGraphicsLayer.addLayer(selectedLayer);
                                    }} style={{ fontSize: '12px' }}>Ir a la intervención</a>

                                </div>
                            }
                        >
                            <div style={{ fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: value.template }} />
                        </Card>
                    </div>
                );
            })}
        </>
    );
}

