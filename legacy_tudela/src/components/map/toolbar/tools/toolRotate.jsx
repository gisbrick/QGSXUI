import { Button, Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import 'font-gis/css/font-gis.css';


const toolRotate = ({mapView, selectedTool, setSelectedTool, action}) => {
    const [rotation, setRotation] = useState()
    
    //Iconos:
    //https://viglino.github.io/font-gis/

    useEffect(() => {
        setRotation(0);
        mapView.on('rotate', ()=>{
            setRotation(mapView._bearing)
        });
    }, [])

 
    const getClasName = () => {
        const rotateOptions = [0, 20, -10, 10, 20, 45, 90, 135, 180, 225, 270, 315];

        const rotationInDegrees = rotateOptions.reduce((prev, curr) => 
            Math.abs(curr - Math.round((rotation * (180 / Math.PI)) / 10) * 10) < Math.abs(prev - Math.round((rotation * (180 / Math.PI)) / 10) * 10) ? curr : prev
        );
        let className = "fg-compass-needle fg-rotate" + rotationInDegrees;
        return className;
    }
   
    return (
        <Tooltip title={"Rotar mapa"}>
            <Button type="primary" shape="circle" size='large'
                onMouseOver={(e) => window.mouseOverButton = true}
                onMouseOut={(e) => window.mouseOverButton = false}
                onClick={(e) => {
                    mapView.rotateControl._cycleState(e);
                }}
                onMouseDown={(e) => {
                    mapView.rotateControl._handleMouseDown(e);
                }}
                onMouseUp={(e) => {                    
                    //mapView.rotateControl._handleMouseUp(e);  
                }}>
                {<i className={getClasName()}></i>}
            </Button>
        </Tooltip>
    );
};

export default toolRotate;