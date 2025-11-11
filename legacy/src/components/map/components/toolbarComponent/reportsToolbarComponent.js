import { useEffect, useRef, useState } from "react";
import { Button, Drawer, Modal, Space, Tooltip } from "antd";
import Icon, { PlusOutlined } from '@ant-design/icons';
import i18next from "i18next";

import { ReactComponent as print_icon } from '../../../../assets/esri/print-32.svg'
import { QgisService } from "../../../../service/qgisService";
import { getWMSLayer } from "../../../../utilities/mapUtils";
import ReportsComponentModal from "../reports/reportsComponentModal";




function ReportsToolbarComponent({ map, QGISPRJ, WMTSLAYERS, mapView, selectedTool, setSeletedTool, onSelectToolChange, editarAspectoCursor,
    tourOpen, setTourOpen, tourSteps, setTourSteps }) {

    const [printLayouts, setPrintLayouts] = useState()
    const [showPrintLayoutsModal, setShowPrintLayoutsModal] = useState()

    //Referencias de elementos que luego utilizaremos en tour de ayuda
    const refButtonPrintLayout = useRef(null);


    //Evaluamos los layouts de impresión del proyecto
    let getPrintLayouts = () => {
        let printLayoutsAux = []
        if (QGISPRJ.layoutManager && QGISPRJ.layoutManager.layouts) {
            for (let i in QGISPRJ.layoutManager.layouts) {
                let layout = QGISPRJ.layoutManager.layouts[i]
                if (layout.classType == "QgsPrintLayout") {
                    printLayoutsAux.push(layout)
                }
            }
        }
        setPrintLayouts(printLayoutsAux);
    }

    //Este método carga los pasos de ayuda, dependiendo de las herrmientas que estén visibles (revisar para ellos las condiciones de visibilidad de los botones de cada herramienta)
    const loadHelpSteps = () => {
        let steps = [];
        if (printLayouts && printLayouts.length > 0) {
            steps.push({
                title: i18next.t('common.tools.help.map.reports.button.title'),
                description: i18next.t('common.tools.help.map.reports.button.description'),
                //placement: 'top',
                target: () => refButtonPrintLayout.current,
            })
        }

        setTourSteps(steps)
    }

    useEffect(() => {
        getPrintLayouts();  
    }, [])

    useEffect(() => {      
        loadHelpSteps()
    }, [printLayouts])

    return (
        <>
            {printLayouts && printLayouts.length > 0 &&
                <Space wrap align="start">
                    {/* BOTON TOOL MAPAS BASE, solo si tenemos más de 1 mapa base*/}

                    <Space direction="vertical" align="start">

                        <Tooltip title={i18next.t('common.tools.print.layout.name')} key={"print.layout"}>
                            <Button ref={refButtonPrintLayout} size='large' onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                                onClick={(e) => {
                                    setShowPrintLayoutsModal(true)
                                    e.stopPropagation();
                                    window.mouseOverButton = false
                                }}
                                type={"default"} shape="circle">
                                <Icon component={print_icon} />
                            </Button>
                        </Tooltip>
                    </Space>
                </Space>
            }
            {showPrintLayoutsModal &&
                <ReportsComponentModal printLayouts={printLayouts} map={map} QGISPRJ={QGISPRJ} WMTSLAYERS={WMTSLAYERS} mapView={mapView}
                    visible={showPrintLayoutsModal} setVisible={setShowPrintLayoutsModal} />

            }
        </>)
}


export default ReportsToolbarComponent;