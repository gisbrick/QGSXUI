import { Empty } from "antd";
import ListComponent from "../list/listComponent";
import MapComponent from "../map/mapComponent";
import ListComponentPaged from "../list/listComponentPaged";
import OpendataComponent from "../opendata/OpendataComponent";
import ReportComponent from "../reports/ReportComponent";
import { SafeArea } from "antd-mobile";
import { BrowserView, MobileView } from "react-device-detect";
import ListComponentPagedMobile from "../list/listComponentPagedMobile";

function ContentLEAF({ app, leaf }) {

    const renderContentMobile = () => {
        if (leaf.contentType == "map") {
            return <div style={{ width: "100%", height: "500px" }}>
                <MapComponent map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }}
                callbackMapLoaded={null} setCallbackMapLoaded={null} blockTools={false}></MapComponent>
            </div>
        }
        else if (leaf.contentType == "opendata") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <OpendataComponent map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }} layer={leaf.table}></OpendataComponent>
            </div>
        }
        else if (leaf.contentType == "report") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <ReportComponent map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }} layoutName={leaf.layout}></ReportComponent>
            </div>
        }      
        else if (leaf.contentType == "table") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <ListComponentPaged map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }} layer={leaf.table}></ListComponentPaged>
            </div>
        }
        else {
            return <Empty />
        }
    }

    const renderContentBrowser = () => {
        if (leaf.contentType == "map") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <MapComponent map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }}
                callbackMapLoaded={null} setCallbackMapLoaded={null} blockTools={false}></MapComponent>
            </div>
        }
        else if (leaf.contentType == "opendata") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <OpendataComponent map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }} layer={leaf.table}></OpendataComponent>
            </div>
        }
        else if (leaf.contentType == "report") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <ReportComponent map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }} layoutName={leaf.layout}></ReportComponent>
            </div>
        }
        else if (leaf.contentType == "table") {
            return <div style={{ width: "100%", height: leaf.height }}>

                <BrowserView>
                    <ListComponentPaged map={{
                        unit: app.idUnt.unitName,
                        permission: leaf.permission,
                        map: leaf.project
                    }} layer={leaf.table}></ListComponentPaged>
                </BrowserView>
                <MobileView>
                    <ListComponentPagedMobile map={{
                        unit: app.idUnt.unitName,
                        permission: leaf.permission,
                        map: leaf.project
                    }} layer={leaf.table}></ListComponentPagedMobile>
                </MobileView>


            </div>
        }
        else {
            return <Empty />
        }
    }

    return (
        <>
            <BrowserView>
                {renderContentBrowser()}
            </BrowserView>
            <MobileView>
                {renderContentMobile()}
            </MobileView>

        </>
    );
}

export default ContentLEAF;

