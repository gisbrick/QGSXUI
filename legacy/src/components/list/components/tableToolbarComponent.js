import { useState, useEffect, useRef } from "react";
import { ClearOutlined, DeleteOutlined, DownOutlined, FilterOutlined, PlusOutlined, ReloadOutlined, SelectOutlined } from "@ant-design/icons";
import { Badge, Button, Dropdown, Menu, Popover, Space, Switch } from "antd";
import i18next from "i18next";
import DownloadComponent from "./downloadComponent";
import AttributesFilterComponent from "./filters/attributesFilterComponent";
import ReportsComponent from "./reportsComponent";
import { useSelector } from "react-redux";
import { popoverFilter_state } from "../../../features/popOverFilter/popOverFilterSlice";
import { HasAccessToLayerTool, HasAccessToProjectTool } from "../../../utilities/SecurityUtil";

const TableToolbarComponent = ({ map, QGISPRJ, layer, qgisLayer, count, totalCount, reload, mapView, columns, scroll, virtualData, tableActions, selection, tourStepsToolbar, setTourStepsToolbar }) => {

    const [filtered, setFiltered] = useState()
    //const [popoverFilterVisible, setPopoverFilterVisible] = useState(false)
    //const state_popoverFilter = useSelector(popoverFilter_state)
    const [tourStepsRoot, setTourStepsRoot] = useState([]);
    const [stepDownload, setStepDownload] = useState([]);
    const [stepReport, setStepReport] = useState([]);

    const refDescription = useRef(null);
    const refFiltroExtension = useRef(null);
    const refSelection = useRef(null);
    const botonCreate = useRef(null);
    const botonFiltro = useRef(null);
    const botonBorrar = useRef(null);

    function getItem(label, key, icon, children, type) {
        return {
            key,
            icon,
            children,
            label,
            type,
        };
    }

    function filterByMapChange(checked, event) {
        qgisLayer.changeFilterByMap(checked);
    }

    let selectionItems = [{
        key: 'clear',
        label: (
            <a onClick={() => tableActions.clearSelection()}>
                {i18next.t('common.actions.select.clear')}
            </a>
        ),
    }]

    if (qgisLayer.WFSCapabilities.allowDelete) {
        selectionItems.push({
            key: 'delete',
            label: (
                <a onClick={() => tableActions.deleteSelection()}>
                    {i18next.t('common.actions.select.delete')}
                </a>
            ),
        })
    }

    if (qgisLayer.WFSCapabilities.allowUpdate) {
        selectionItems.push({
            key: 'edit',
            label: (
                <a onClick={() => tableActions.updateSelection()}>
                    {i18next.t('common.actions.select.edit')}
                </a>
            ),
        })
    }

    //selectionItems.push()



    if (mapView) {
        selectionItems.push({
            key: 'zoom',
            label: (
                <a onClick={() => tableActions.zoomSelection()}>
                    {i18next.t('common.actions.select.zoom')}
                </a>
            ),
        })
    }

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

    //Este método carga los pasos de ayuda, dependiendo de las herrmientas que estén visibles (revisar para ellos las condiciones de visibilidad de los botones de cada herramienta)
    const loadHelpSteps = () => {
        let steps = [];

        steps.push({
            title: i18next.t('common.tools.help.table.description.text.title'),
            description: i18next.t('common.tools.help.table.description.text.description'),
            //placement: 'top',
            target: () => refDescription.current,
        })
        if (mapView) {
            steps.push({
                title: i18next.t('common.tools.help.table.filter_extension.filter.title'),
                description: i18next.t('common.tools.help.table.filter_extension.filter.description'),
                //placement: 'top',
                target: () => refFiltroExtension.current,
            })
        }

        if(!qgisLayer.has_geometry && qgisLayer.WFSCapabilities.allowInsert) {
            steps.push({
                title: i18next.t('common.tools.help.table.create.button.title'),
                description: i18next.t('common.tools.help.table.create.button.description'),
                //placement: 'top',
                target: () => botonCreate.current,
            })
        }
        //console.log("filtered", filtered)
        //console.log("mapView", mapView)
        if(filtered) {
            steps.push({
                title: i18next.t('common.tools.help.table.delete_filter.button.title'),
                description: i18next.t('common.tools.help.table.delete_filter.button.description'),
                //placement: 'top',
                target: () => botonBorrar.current,
            })
        }

        if(HasAccessToProjectTool(QGISPRJ, "FILTERS") && HasAccessToLayerTool(QGISPRJ, qgisLayer.name, "FILTERS") && !mapView) {
            steps.push({
                title: i18next.t('common.tools.help.table.filter_query.button.title'),
                description: i18next.t('common.tools.help.table.filter_query.button.description'),
                //placement: 'top',
                target: () => botonFiltro.current,
            })
        }

        setTourStepsRoot(steps)
    }

    useEffect(() => {
        loadHelpSteps()
        let steps = [...tourStepsRoot].concat([...stepDownload]).concat([...stepReport])
        if (selection && selection.length > 0) {
            steps.push({
                title: i18next.t('common.tools.help.table.selection.link.title'),
                description: i18next.t('common.tools.help.table.selection.link.description'),
                //placement: 'top',
                target: () => refSelection.current,
            })
        }
        //console.log(steps)
        setTourStepsToolbar(steps)
    }, [filtered, selection, stepDownload, stepReport])


    /*useEffect(() => {
        setPopoverFilterVisible(false)
    }, [state_popoverFilter])*/

    return (
        <>
            <Space style={{ margin: "10px" }} wrap>
                <>&nbsp;&nbsp;{<div className="reader" ref={refDescription}>{i18next.t('common.msg.count.selection', { total: totalCount, shown: count, selection: selection.length })}</div>}</>

                {!qgisLayer.has_geometry && qgisLayer.WFSCapabilities.allowInsert &&
                    <Button
                    ref={botonCreate}
                    onClick={(e) => tableActions.insert()} 
                    type={"primary"}>
                        <Space>
                            <div className="reader">{i18next.t('common.actions.create.name')}</div>
                            <PlusOutlined />
                        </Space>
                    </Button>
                }

                {/*
                    <Button onClick={(e) => tableActions.refresh()}>
                        <Space>
                            {i18next.t('common.actions.refresh.name')}
                            <ReloadOutlined />
                        </Space>


                    </Button>*/
                }

                {mapView &&
                    <>
                        <Switch ref={refFiltroExtension} checked={qgisLayer.filterByMap} onChange={filterByMapChange} checkedChildren={i18next.t('common.actions.filter.byMapExtension')} unCheckedChildren={i18next.t('common.actions.filter.byMapExtension')} />
                    </>}

                {/* MOSTRAMOS FILTROS SOLO SI NO HAY MAPA, YA QUE SI HAY MAPA, LOS FILTROS YA EStAN EN  EL TOC*/}
                {!mapView && filtered && 
                <Button 
                ref={botonBorrar}
                onClick={(e) => deleteTableFilter()}>
                    <Space>
                        <div className="reader">{i18next.t('common.tools.delete_filter.name')}</div>
                        <DeleteOutlined />
                    </Space>
                </Button>}
                {HasAccessToProjectTool(QGISPRJ, "FILTERS") && HasAccessToLayerTool(QGISPRJ, qgisLayer.name, "FILTERS") && !mapView && 
                <Popover content={<AttributesFilterComponent QGISPRJ={QGISPRJ} map={map} qgisLayer={qgisLayer} reloadTable={reloadTable} tableActions={tableActions} /*setShowDrawerToc={null} setPopoverFilterVisible={setPopoverFilterVisible}*/ />}
                    title={<div className="reader">{i18next.t('common.tools.filter.name')}</div>}
                    //open={popoverFilterVisible}
                    trigger="click">
                    <Button
                    ref={botonFiltro}
                    >
                        <Space>
                            <div className="reader">{i18next.t('common.tools.filter.name')}</div>
                            <FilterOutlined />
                        </Space>
                    </Button>
                </Popover>}

                <ReportsComponent map={map} QGISPRJ={QGISPRJ} layer={layer} qgisLayer={qgisLayer} mapView={mapView} selection={selection} setStepReport={setStepReport}></ReportsComponent>

                <DownloadComponent map={map} QGISPRJ={QGISPRJ} layer={layer} qgisLayer={qgisLayer} mapView={mapView} selection={selection} setStepDownload={setStepDownload}></DownloadComponent>

                {selection && selection.length > 0 &&
                    <Dropdown menu={{ items: selectionItems }}>
                        <a onClick={(e) => e.preventDefault()} ref={refSelection}>
                            <Space>
                                <SelectOutlined />
                                <div className="reader">{i18next.t('common.actions.select.selection')}</div>
                                <DownOutlined />
                            </Space>
                        </a>
                    </Dropdown>}
            </Space >
        </>
    )
};
export default TableToolbarComponent;