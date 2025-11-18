import { Button, Dropdown, Tooltip } from 'antd';
import React from 'react';
import 'font-gis/css/font-gis.css';


const ToolMeasures = ({ mapView, selectedTool, setSelectedTool, action, toolsPanes }) => {
    //Iconos:
    //https://viglino.github.io/font-gis/

    const [dropdownVisible, setDropdownVisible] = React.useState();
    const [mouseOverDropdown, setMouseOverDropdown] = React.useState();

    toolsPanes.hidePanes["ToolMeasures"] = setDropdownVisible;



    const getButtonMeasuresClassName = () => {
        return selectedTool == "MEASURE_LINES" || selectedTool == "MEASURE_AREAS" ? "selectedToolButton" : "";
    }
    const getButtonMeasureLinesClassName = () => {
        return selectedTool == "MEASURE_LINES" ? "selectedToolButton" : "";
    }
    const getButtonMeasureAreasClassName = () => {
        return selectedTool == "MEASURE_AREAS" ? "selectedToolButton" : "";
    }


    const items = [
        {
            key: '1',
            label: (
                <Tooltip title={"Medición de líneas"} placement="bottom">
                    <Button type="primary" shape="circle" size='large' className={getButtonMeasureLinesClassName()}
                        onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={() => {
                            action("MEASURE_LINES");
                        }}>
                        {<i className="fg-measure-line"></i>}
                    </Button>
                </Tooltip>
            )
        },
        {
            key: '2',
            label: (
                <Tooltip title={"Medición de áreas"} placement="bottom">
                    <Button type="primary" shape="circle" size='large' className={getButtonMeasureAreasClassName()}
                        onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={() => {
                            action("MEASURE_AREAS");
                        }}>
                        {<i className="fg-measure-area"></i>}
                    </Button>
                </Tooltip>
            )
        }
    ];


    return (
        <>
            <Dropdown

                menu={{
                    items: items,
                }}
                onMouseOver={(e) => window.mouseOverButton = true}
                onMouseOut={(e) => window.mouseOverButton = false}
                overlayStyle={{
                    paddingTop: "10px"
                }}
                placement="bottom"
                trigger={['click']}
                onOpenChange={(visible) => {
                    toolsPanes.hide();
                    setDropdownVisible(visible)
                }}
            >
                <a onClick={(e) => e.preventDefault()}>
                    <Tooltip title={"Mediciones"} onMouseOver={() => setMouseOverDropdown(true)} onMouseOut={() => setMouseOverDropdown(false)}
                        popupVisible={dropdownVisible} open={!dropdownVisible && mouseOverDropdown}>
                        <Button type="primary" shape="circle" size='large' className={getButtonMeasuresClassName()}
                            onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}>
                            {<i className="fg-measure"></i>}
                        </Button>
                    </Tooltip>
                </a>
            </Dropdown></>
    );
};

export default ToolMeasures;