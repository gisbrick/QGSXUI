import { Button, Card, Drawer, Input, Tooltip } from 'antd';
import React, { useContext } from 'react';
import 'font-gis/css/font-gis.css';
import { MapViewContext } from '../../../../context/mapViewProvider';

const ToolList = ({ selectedTool, setSelectedTool, action }) => {
    //Iconos:
    //https://viglino.github.io/font-gis/
    const { mapView, setMapView } = useContext(MapViewContext)
    const [showDrawer, setShowDrawer] = React.useState();

    return (
        <>
            <Tooltip title={"Lista de intervenciones del mapa"}>
                <Button type="primary" shape="circle" size='large'
                    onMouseOver={(e) => window.mouseOverButton = true}
                    onMouseOut={(e) => window.mouseOverButton = false}
                    onClick={() => setShowDrawer(true)}>
                    {<i className="fa fa-list-ol"></i>}
                </Button>
            </Tooltip>
            <Drawer
                title="Lista de intervenciones"
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
                <ListContent mapView={mapView} setShowDrawer={setShowDrawer}></ListContent>
            </Drawer>
        </>

    );
};

export default ToolList;

const ListContent = ({ mapView, setShowDrawer }) => {
    const listLayerName = "Intervenciones";
    const mapLayer = mapView._layers && Object.values(mapView._layers).find(layer => layer.name === listLayerName);
    const [searchTerm, setSearchTerm] = React.useState('');

    const layerIntervenciones = mapLayer._layers && Object.values(mapLayer._layers)[0]; // Access the first key

    const filteredLayers = mapLayer ? Object.keys(layerIntervenciones._layers).filter(key => {
        const layer = layerIntervenciones._layers[key];
        return layer.popupContent && layer.popupContent.toLowerCase().includes(searchTerm.toLowerCase());
    }) : [];

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


            {filteredLayers.map((key, index) => {
                const layer = mapView._layers[key];
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
                            <div style={{ fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: layer.popupContent }} />
                        </Card>
                    </div>
                );
            })}
        </>
    );
}