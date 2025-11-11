import { useState, useEffect, useRef } from "react";
import { DownOutlined, DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { Badge, Button, Dropdown, Menu, Modal, Select, Space, Switch } from "antd";
import i18next from "i18next";
import ReportComponent from "../../reports/ReportComponent";

const ReportsComponent = ({ map, QGISPRJ, layer, qgisLayer, mapView, selection, setStepReport }) => {

    const [qgislayerReport, setQgislayerReport] = useState()
    const [exportVisible, setExportVisible] = useState()
    const refReport = useRef(null);

    const download = (report) => {
        report["qgisLayer"] = qgisLayer
        report["selection"] = selection

        setQgislayerReport(report)
        setExportVisible(true)
    }

    const handleCancelExport = () => {
        setExportVisible(false)
        setQgislayerReport(null)
    }

    const getReports = (reports) => {
        let out = []
        for (let i in reports) {
            let report = reports[i]
            out.push({
                key: report.reportName,
                label: <a onClick={() => download(reports[i])}>
                    {report.reportName}
                </a>
            })
        }
        return out;
    }

    const render = () => {
        let out = <></>
        if ("URBEGIS_LAYER_REPORTS" in QGISPRJ.variables) {
            let URBEGIS_LAYER_REPORTS = JSON.parse(QGISPRJ.variables["URBEGIS_LAYER_REPORTS"])
            if ("table" in URBEGIS_LAYER_REPORTS) {
                if (qgisLayer.name in URBEGIS_LAYER_REPORTS["table"]) {
                    out = <Dropdown menu={{ items: getReports(URBEGIS_LAYER_REPORTS["table"][qgisLayer.name]) }}>
                        <a ref={refReport} onClick={(e) => e.preventDefault()}>
                            <Space>
                                <DownloadOutlined />
                                <div className="reader">{i18next.t('common.tools.reports.name')}</div>
                                <DownOutlined />
                            </Space>
                        </a>
                    </Dropdown>
                }
            }
        }
        return out
    }

    const stepsHelp = () => {
        let steps = []

        steps.push({
            title: "report",
            description: "report",
            target: () => refReport.current,
        })

        setStepReport(steps)
    }

    useEffect(() => {
        if ("URBEGIS_LAYER_REPORTS" in QGISPRJ.variables) {
            let URBEGIS_LAYER_REPORTS = JSON.parse(QGISPRJ.variables["URBEGIS_LAYER_REPORTS"])
            if ("table" in URBEGIS_LAYER_REPORTS) {
                if (qgisLayer.name in URBEGIS_LAYER_REPORTS["table"]) {
                    stepsHelp()
                }
            }
        }
    }, [])

    return (
        <>
            {render()}

            {qgislayerReport && <Modal
                title={<div className="reader">{i18next.t('common.tools.reports.name')}</div>}
                open={exportVisible}
                footer={null}
                onCancel={() => handleCancelExport()}>
                <ReportComponent layoutName={qgislayerReport.reportName} map={map} qgislayerReport={qgislayerReport} endExport={handleCancelExport}></ReportComponent>
            </Modal>}
        </>
    )
};
export default ReportsComponent;