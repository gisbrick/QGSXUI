import { useState, useEffect } from "react";
import { FilterOutlined, DeleteOutlined, TableOutlined, ClockCircleOutlined, QuestionOutlined } from '@ant-design/icons';
import { Popover, Space, Tooltip } from 'antd';
import i18next from "i18next";
import TemporalFilterComponent from "../../list/components/filters/temporalFilterComponent";
import { refreshWMSLayer } from "../../../utilities/mapUtils";
import AttributesFilterComponent from "../../list/components/filters/attributesFilterComponent";
import Icon from "@ant-design/icons/lib/components/Icon";
import { useDispatch, useSelector } from 'react-redux';
import { cambio } from "../../../features/query/querySlice";
import { getFieldsOrdererdName } from "../../../utilities/mapUtils";
import { HasAccessToLayerTool, HasAccessToProjectTool } from "../../../utilities/SecurityUtil";
import { popoverFilter_state } from "../../../features/popOverFilter/popOverFilterSlice";

const LayerTreeItemComponent = ({ child, parent, map, mapView, LEGEND, QGISPRJ, setShowDrawerToc, showDrawerToc, leyenda, letterSizeLegend, letterColorLegend, letterTypeLegend }) => {

    //const state_popoverFilter = useSelector(popoverFilter_state)

    //const [popoverFilterVisible, setPopoverFilterVisible] = useState(false)

    const dispatch = useDispatch();

    /*useEffect(() => {
        setPopoverFilterVisible(false)
    }, [state_popoverFilter])*/


    const qgisLayer = mapView.QGISPRJ.layers[child.name];

    const [filter, setFilter] = useState(qgisLayer.filter)

    qgisLayer.reactor.addEventListener('filterAdded', function () {
        setFilter(qgisLayer.filter);
    });
    /*
    let filterLayer = () => {
        qgisLayer.filter = "1=0"
        qgisLayer.addFilter("1=0")
        if (mapView) refreshWMSLayer(mapView);
    }*/
    let deleteLayerFilter = () => {
        qgisLayer.addFilter(null)
        qgisLayer.filter = null
        dispatch(cambio())
        if (mapView) refreshWMSLayer(mapView);
    }
    let showTable = () => {
        mapView.showTable(child.name)
    }

    const haveFields = () => {
        let fieldsCopy = []
        let formularioFields = getFieldsOrdererdName(qgisLayer, true)
        for (let i in qgisLayer.fields) {
            let f = qgisLayer.fields[i];
            if (formularioFields.includes(f.name)) {
                let label = f.alias ? f.alias : f.name
                let value = {
                    value: f.name,
                    label: label
                }
                if (f.editorWidgetSetup) {
                    if (f.editorWidgetSetup.type != "Hidden") {
                        fieldsCopy.push(value)
                    }
                }
                else {
                    fieldsCopy.push(value)
                }
            }
        }
        if (fieldsCopy.length > 0) {
            return true
        } else {
            return false
        }
    }

    return (

        <>
            <Space wrap>
                <><span style={{ fontFamily: letterTypeLegend, fontSize: letterSizeLegend + "px", color: letterColorLegend }}>{child.name.replaceAll("_", " ")}</span></>
                {leyenda && !leyenda.length}

                {/*Filtro */}
                {HasAccessToProjectTool(QGISPRJ, "FILTERS") && HasAccessToLayerTool(QGISPRJ, qgisLayer.name, "FILTERS") &&
                    haveFields(mapView.QGISPRJ.layers[child.name]) && qgisLayer.classType == 'QgsVectorLayer' && <Tooltip title={i18next.t('common.tools.filter.name')}>
                        <Popover
                            //open={popoverFilterVisible}
                            placement="bottomRight"
                            content={<AttributesFilterComponent QGISPRJ={mapView.QGISPRJ} map={map} mapView={mapView} qgisLayer={qgisLayer} /*setShowDrawerToc={setShowDrawerToc} setPopoverFilterVisible={setPopoverFilterVisible}*/ />}
                            title={<div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                                <div style={{ flexGrow: 1 }}>
                                    {i18next.t('common.tools.filter.name')}
                                </div>
                                {/*<div>
                                    <a href="https://ant.design/components/icon">
                                        <Icon component={QuestionOutlined} onClick={() => alert("pdf de ayuda de la herramienta")} />
                                    </a>
                                </div>*/}
                            </div>} trigger="click">
                            <FilterOutlined />
                        </Popover>
                    </Tooltip>}

                {/*Eliminar filtro */}
                {qgisLayer.classType == 'QgsVectorLayer' && filter && <Tooltip title={i18next.t('common.tools.delete_filter.name')}>
                    <DeleteOutlined onClick={() => deleteLayerFilter()} />
                </Tooltip>}

                {/*Filtro temporal */}
                {qgisLayer.classType == 'QgsVectorLayer' && qgisLayer.temporalProperties.isActive == "true" && <Tooltip title={i18next.t('common.tools.temporal_filter.name')}>
                    <Popover
                        content={<TemporalFilterComponent map={map} mapView={mapView} qgisLayer={qgisLayer} />}
                        title={i18next.t('common.tools.temporal_filter.name')} trigger="click">
                        <ClockCircleOutlined />
                    </Popover>
                </Tooltip>}
                {/*Tabla */}
                {HasAccessToProjectTool(QGISPRJ, "TABLE") && HasAccessToLayerTool(QGISPRJ, qgisLayer.name, "TABLE") &&
                    haveFields(mapView.QGISPRJ.layers[child.name]) && qgisLayer.classType == 'QgsVectorLayer' && qgisLayer.WFSCapabilities.allowQuery && <Tooltip title={i18next.t('common.tools.table.name')}>
                        <TableOutlined onClick={() => { showTable() }} />
                    </Tooltip>}
            </Space>

            {leyenda && leyenda.length >0 ? leyenda.map((item, index) => {
                return <li key={"Legend_item_" + index}>{item.icon} <span style={{ fontFamily: letterTypeLegend, fontSize: letterSizeLegend + "px", color: letterColorLegend }}>{item.name}</span></li>
            }
            ) : <div style={{marginLeft:"5px"}}>{leyenda}</div>}
        </>

    )
};
export default LayerTreeItemComponent;
