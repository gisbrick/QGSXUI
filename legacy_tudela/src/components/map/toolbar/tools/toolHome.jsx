import { Button, Tooltip } from 'antd';
import React from 'react';
import 'font-gis/css/font-gis.css';


const ToolHome = ({mapView, selectedTool, setSelectedTool, action}) => {   
    //Iconos:
    //https://viglino.github.io/font-gis/

   
    return (
        <Tooltip title={"Ir a extensión inicial"}>
            <Button type="primary" shape="circle" size='large'
                onMouseOver={(e) => window.mouseOverButton = true}
                onMouseOut={(e) => window.mouseOverButton = false}
                onClick={() => action()}>
                {<i className="fg-home"></i>}
            </Button>
        </Tooltip>
    );
};

export default ToolHome;