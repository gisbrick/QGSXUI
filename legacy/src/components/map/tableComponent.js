import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from "react";
import { CaretDownOutlined, CloseCircleOutlined, DeleteOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import TableResultComponent from "./tableResultComponent";
import { Button, Space, Tabs, Tooltip, Tour } from "antd";
import { Content } from "antd/es/layout/layout";
import i18next from "i18next";

const TableComponent = forwardRef(({ mapDiv, mapView, QGISPRJ, tableVisible, tableSize, setTableVisible, setLoading }, ref) => {

    const [tablesResults, setTablesResults] = useState();
    const [tabActiveKey, setTabActiveKey] = useState();
    const [nextTabActive, setNextTabActive] = useState(null);

    const [tourSteps, setTourSteps] = useState([]);
    const [tourStepsToolbar, setTourStepsToolbar] = useState([]);
    const [tourStepsRow, setTourStepsRow] = useState([])
    const [tourOpen, setTourOpen] = useState(false);

    //Referencias de elementos que luego utilizaremos en tour de ayuda
    const refButtonCerrarTablas = useRef(null);
    const refButtonOcultar = useRef(null);
    const refButtonCerrarTabla = useRef(null);
    /*const refButtonHome = useRef(null);
    const refButtonMeasures = useRef(null);
    const refButtonLocation = useRef(null);*/

    let myQGISPRJ = mapView ? mapView.QGISPRJ : QGISPRJ;

    useImperativeHandle(ref, () => ({
        hasResults() {
            return ref.current.tablesResults != null && ref.current.tablesResults.length > 0
        },
        addLayer(layer) {
            ref.current.registerTableAdded(layer);

            //se crea el id del objeto
            let uuid = Math.random().toString(36).slice(-6);

            setTableVisible(true);
            ref.current.tablesResults = ref.current.tablesResults ? [...ref.current.tablesResults] : [];
            ref.current.tablesResults.push({
                id: uuid,
                layer: layer
            });
            setTablesResults(ref.current.tablesResults);
            setTabActiveKey(uuid);
        }
    }), []);

    const loadHelpSteps = () => {
        let steps = [];

        steps.push({
            title: i18next.t('common.tools.help.table.colseAllTables.button.title'),
            description: i18next.t('common.tools.help.table.colseAllTables.button.description'),
            placement: 'right',
            target: () => refButtonCerrarTablas.current,
        })

        steps.push({
            title: i18next.t('common.tools.help.table.collapse.button.title'),
            description: i18next.t('common.tools.help.table.collapse.button.description'),
            placement: 'right',
            target: () => refButtonOcultar.current,
        })
        steps.push({
            title: i18next.t('common.tools.help.table.close.button.title'),
            description: i18next.t('common.tools.help.table.close.button.description'),
            placement: 'right',
            target: () => refButtonCerrarTabla.current,
        })
        setTourSteps(steps)
    }
    /**
 * Cuando se cierra una tabla, conseguir que se muestre la de su derecha o si no hay, 
 * que se muestre la de la izq
 */
    const setNextActiveTable = (table, result) => {
        let index = table.indexOf(result)
        //console.log('index', index)

        //hay elemento por la derecha
        if (table.length - 1 > index) {
            let element = table[index + 1]
            setNextTabActive(element)
            //hay elemento por la izq
        } else if (index > 0) {
            let element = table[index - 1]
            setNextTabActive(element)
        } else {

        }
    }

    const closeTable = (index, id) => {
        let tablesResultsAUx = [...tablesResults];

        let tableDeleted = tablesResultsAUx.find((table) => table.id == id)

        //console.log("tabla eliminada", tableDeleted)
        if (mapView && tableDeleted.graphicsLayer) {
            //Borramos la capa de gráficos del mapa si existe           
            mapView.removeLayer(tableDeleted.graphicsLayer);
        }


        ref.current.registerTableDeleted(tablesResultsAUx);


        setNextActiveTable(tablesResultsAUx, tableDeleted)

        let tableResultsCopy = tablesResultsAUx.filter((result) => result.id != id)

        //tablesResultsAUx.splice(index, 1);
        setTablesResults(tableResultsCopy);
        ref.current.tablesResults = tableResultsCopy;

        if (ref.current.tablesResults.length == 0) {
            ref.current.registerAllTablesDeleted();

        }
        //Ocultamos la tabla si no tenemos resultados
        if (ref.current.tablesResults == null || ref.current.tablesResults.length == 0) {
            setTableVisible(false);
            if (mapView) mapView.invalidateSize(true);
        }
    }

    const closeAllTables = () => {

        for (var i in tablesResults) {
            if (mapView && tablesResults[i].graphicsLayer) {
                //Borramos la capa de gráficos del mapa si existe           
                mapView.removeLayer(tablesResults[i].graphicsLayer);
            }
            ref.current.registerTableDeleted(tablesResults[i]);
        }
        setTablesResults([]);
        ref.current.tablesResults = [];
        //Ocultamos la tabla si no tenemos resultados
        setTableVisible(false);
        if (mapView) mapView.invalidateSize(true);
        ref.current.registerAllTablesDeleted();
    }

    const getTourSteps = () => {
        return tourSteps.concat([...tourStepsToolbar]).concat([...tourStepsRow])
    }

    useEffect(() => {
        loadHelpSteps()
    }, [])


    useEffect(() => {

        if (nextTabActive) {
            setTabActiveKey(nextTabActive.id)
        }

    }, [nextTabActive])

    return (
        <>  {tablesResults &&
            <Content style={{ padding: '0 10px', overflow: 'auto' }}>
                <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: "100" }}>
                    {/* BOTON TOOL AYUDA*/}
                    <Space wrap>
                        {<Tooltip title={i18next.t('common.tools.help.name')} key={"maphelp"}>
                            <Button onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                                onClick={(e) => {
                                    setTourOpen(true)
                                }}
                                type={"default"} shape="circle">
                                <QuestionCircleOutlined />
                            </Button>
                        </Tooltip>}
                    </Space>

                    <Space wrap>
                        <Tooltip title={i18next.t('common.actions.colseAllTables.name')}>
                            <Button ref={refButtonCerrarTablas} shape="circle" onClick={() => closeAllTables()} icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Space>
                    <Space wrap>
                        <Tooltip title={i18next.t('common.actions.hide.name')}>
                            <Button ref={refButtonOcultar} shape="circle" onClick={() => setTableVisible(false)} icon={<CaretDownOutlined />} />
                        </Tooltip>
                    </Space>
                </div>
                <Tabs
                    activeKey={tabActiveKey}
                    onTabClick={(key, event) => setTabActiveKey(key)}
                    items={tablesResults.map((result, i) => {
                        //const id = String(i + 1);
                        //console.log("id tabla", result.id)
                        return {
                            label: <>{result.layer + ' '}
                                <Tooltip title={i18next.t('common.tools.table.close')} key={'common.tools.table.close' + i}>
                                    <CloseCircleOutlined ref={refButtonCerrarTabla} onClick={() => closeTable(i, result.id)}></CloseCircleOutlined>
                                </Tooltip>
                            </>,
                            key: result.id,
                            children: <TableResultComponent tableSize={tableSize} mapDiv={mapDiv} mapView={mapView}
                                layer={result.layer} QGISPRJ={myQGISPRJ} tablesResult={result} tourStepsToolbar={tourStepsToolbar}
                                setTourStepsToolbar={setTourStepsToolbar} setTourStepsRow={setTourStepsRow} setLoading={setLoading}></TableResultComponent>
                        };
                    })}
                />


            </Content>

        }
            {/* TOUR CON LA AYUDA */}
            {tourOpen && <Tour open={tourOpen} onClose={() => { setTourOpen(false); }} steps={getTourSteps()} zIndex={2000}/>}
        </>
    )
});
export default TableComponent;
