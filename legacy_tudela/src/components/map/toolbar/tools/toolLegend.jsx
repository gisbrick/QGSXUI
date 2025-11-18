import { Button, Drawer, Tooltip } from 'antd';
import React from 'react';
import 'font-gis/css/font-gis.css';


const ToolLegend = ({ mapView, selectedTool, setSelectedTool, action }) => {
    //Iconos:
    //https://viglino.github.io/font-gis/

    const [showDrawer, setShowDrawer] = React.useState();


    return (
        <>
            <Tooltip title={"Leyenda"}>
                <Button type="primary" shape="circle" size='large'
                    onMouseOver={(e) => window.mouseOverButton = true}
                    onMouseOut={(e) => window.mouseOverButton = false}
                    onClick={() => setShowDrawer(true)}>
                    {<i className="fg-map-legend"></i>}
                </Button>
            </Tooltip>
            <Drawer
                title="Leyenda"
                placement="right"
                onMouseOver={(e) => window.mouseOverButton = true}
                onMouseOut={(e) => window.mouseOverButton = false}
                closable={true}
                onClose={() => setShowDrawer(false)}
                open={showDrawer}
                width={400}>
                <>TODO MOSTRAR IMAGEN DE LEYENDA</>
            </Drawer>
        </>

    );
};

export default ToolLegend;
