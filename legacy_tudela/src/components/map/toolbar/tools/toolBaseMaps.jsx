import { Button, Card, Drawer, Space, Tooltip } from 'antd';
import React from 'react';
import 'font-gis/css/font-gis.css';
import { IDENA_baseMaps } from '../../../../utilities/leaflet_idena_utilities';
import './ToolBaseMaps.css';
import { isMobile } from 'react-device-detect';

const ToolBaseMaps = ({ mapView, selectedTool, setSelectedTool, action, toolsPanes }) => {
    //Iconos:
    //https://viglino.github.io/font-gis/

    const [showBaseMaps, setShowBaseMaps] = React.useState();

    toolsPanes.hidePanes["ToolBaseMaps"] = setShowBaseMaps;

    const renderSelectBaseMaps = () => {
        return <Card title="" variant="borderless" style={{ width: 300 }}>
            <BaseMaps mapView={mapView} setShowBaseMaps={setShowBaseMaps}></BaseMaps>
        </Card>
    }


    return (
        <Space direction="vertical" style={{ width: '100%', alignItems: 'center' }}>
            <Tooltip title={"Cambiar mapa base"}>
                <Button type="primary" shape="circle" size='large'
                    onMouseOver={(e) => window.mouseOverButton = true}
                    onMouseOut={(e) => window.mouseOverButton = false}
                    onClick={() => {
                        toolsPanes.hide();
                        setShowBaseMaps(!showBaseMaps);
                    }}>
                    {<i className="fg-world-map"></i>}
                </Button>
            </Tooltip>
            {!isMobile && <div style={{ position: 'relative', width: '100%' }}
                onMouseOver={(e) => window.mouseOverButton = true}
                onMouseOut={(e) => window.mouseOverButton = false}>
                {showBaseMaps && <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)' }}>
                    {renderSelectBaseMaps()}
                </div>}
            </div>}
            {isMobile && <Drawer
                title="Mapas base"
                placement="right"
                closable={true}
                onClose={() => setShowBaseMaps(false)}
                open={showBaseMaps}
                width={400}>
                <>
                    {renderSelectBaseMaps()}
                </>
            </Drawer>}
        </Space>
    );
};

export default ToolBaseMaps;

const BaseMaps = ({ mapView, setShowBaseMaps }) => {

    const baseMaps = IDENA_baseMaps;

    const select = (baseMap) => {
        setShowBaseMaps(false);

        //Eliminamos el mapa base actual
        mapView.basemap.remove();

        //Añadimos el nuevo mapa base
        mapView.basemap = baseMap.layer;
        mapView.basemapName = baseMap.name;
        mapView.basemap.addTo(mapView);

    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {baseMaps.map(baseMap => (
                <div key={baseMap.id} style={{ textAlign: 'center' }} onClick={() => select(baseMap)}>
                    <img className={"baseMap " + (mapView.basemapName == baseMap.name ? "selectedBaseMap" : "")}
                        src={baseMap.thumbnail} alt={baseMap.name} style={{ width: '100%' }} />
                    <div>{baseMap.alias}</div>
                </div>
            ))}
        </div>
    );
};

