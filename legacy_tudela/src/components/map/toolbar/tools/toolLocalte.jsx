import { Button, Tooltip } from 'antd';
import React from 'react';
import 'font-gis/css/font-gis.css';


const ToolLocate = ({mapView, selectedTool, setSelectedTool, action}) => {
    let [locateActive, setLocateActive] = React.useState(false);
    //Iconos:
    //https://viglino.github.io/font-gis/

    const changeLocationActive = () => {
        action(!locateActive)
        setLocateActive(!locateActive);
    }

    return (
        <Tooltip title={"Localizar por posición GPS"}>
            <Button type="primary" shape="circle" size='large'
                onMouseOver={(e) => window.mouseOverButton = true}
                onMouseOut={(e) => window.mouseOverButton = false}
                onClick={() => changeLocationActive()}>
                {!locateActive && <i className="fg-location"></i>}
                {locateActive && <i className="fg-location-on"></i>}
            </Button>
        </Tooltip>
    );
};

export default ToolLocate;