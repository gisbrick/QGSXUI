import { Button, Dropdown, Tooltip } from 'antd';
import React, { useEffect } from 'react';
import 'font-gis/css/font-gis.css';


const ToolStreetView = ({ mapView, selectedTool, setSelectedTool, action, toolsPanes }) => {
    //Iconos:
    //https://viglino.github.io/font-gis/

    const getClassName = () => {
        return selectedTool == "STREETVIEW" ? "selectedToolButton" : "";
    }

  
    useEffect(() => {
       
    }, []);


    return (
        <Tooltip title={"StreetView"}>
            <Button type="primary" shape="circle" size='large' className={getClassName()}
                onMouseOver={(e) => window.mouseOverButton = true}
                onMouseOut={(e) => window.mouseOverButton = false}
                onClick={() => action("STREETVIEW")}>
                {<i className="fg-location-man"></i>}
            </Button>
        </Tooltip>
    );
};

export default ToolStreetView;