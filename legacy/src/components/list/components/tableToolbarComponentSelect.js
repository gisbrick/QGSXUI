import { useState, useEffect } from "react";
import { ClearOutlined, DeleteOutlined, DownOutlined, FilterOutlined, PlusOutlined, ReloadOutlined, SelectOutlined } from "@ant-design/icons";
import { Badge, Button, Dropdown, Menu, Popover, Space, Switch } from "antd";
import i18next from "i18next";
import DownloadComponent from "./downloadComponent";
import AttributesFilterComponent from "./filters/attributesFilterComponent";
import { useSelector } from "react-redux";
import { popoverFilter_state } from "../../../features/popOverFilter/popOverFilterSlice";

const TableToolbarComponentSelect = ({ map, QGISPRJ, layer, qgisLayer, count, reload, mapView, columns, scroll, virtualData, tableActions, selection }) => {

    const [filtered, setFiltered] = useState()
    //const [popoverFilterVisible, setPopoverFilterVisible] = useState(false)
    //const state_popoverFilter = useSelector(popoverFilter_state)

    const deleteTableFilter = () => {
        qgisLayer.addFilter(null)
        qgisLayer.filter = null
        setFiltered(false)
        reload()
    }
    const reloadTable = () => {
        if (qgisLayer.filter) {
            setFiltered(true)
        }
        reload()
    }



    /*useEffect(() => {
        setPopoverFilterVisible(false)
    }, [state_popoverFilter])*/


    return (
        <>
            <Space style={{margin: "10px"}} wrap>
               
                {
                    <Button onClick={(e) => tableActions.refresh()}>
                        <Space>
                            <div className="reader">{i18next.t('common.actions.refresh.name')}</div>
                            <ReloadOutlined />
                        </Space>


                    </Button>
                }

                {/* MOSTRAMOS FILTROS SOLO SI NO HAY MAPA, YA QUE SI HAY MAPA, LOS FILTROS YA EStAN EN  EL TOC*/}
                {!mapView && filtered && <Button onClick={(e) => deleteTableFilter()}>
                    <Space>
                        <div className="reader">{i18next.t('common.tools.delete_filter.name')}</div>
                        <DeleteOutlined />
                    </Space>
                </Button>}
                {!mapView && <Popover content={<AttributesFilterComponent QGISPRJ={QGISPRJ} map={map} qgisLayer={qgisLayer} reloadTable={reloadTable} /*setShowDrawerToc={null} setPopoverFilterVisible={setPopoverFilterVisible} *//>}
                    title={<div className="reader">{i18next.t('common.tools.filter.name')}</div>}
                    //open={popoverFilterVisible}
                    trigger="click">
                    <Button>
                        <Space>
                            <div className="reader">{i18next.t('common.tools.filter.name')}</div>
                            <FilterOutlined/>
                        </Space>
                    </Button>
                </Popover>}              
            </Space >
        </>
    )
};
export default TableToolbarComponentSelect;