import React from 'react';
import { Empty } from "antd";
import MapComponent from "../map/mapComponent";
import ListComponentPaged from "../list/listComponentPaged";
import OpendataComponent from "../opendata/OpendataComponent";
import ReportComponent from "../reports/ReportComponent";
import { BrowserView, MobileView } from "react-device-detect";
import ListComponentPagedMobile from "../list/listComponentPagedMobile";
import ScheduleComponentInit from "../schedule/scheduleComponentInit";
import HtmlEditor from "../inputs/custom/htmlEditorComponent";
import SurveyComponent from "../survey/surveyComponent";
import ExternalReportComponent from '../reports/ExternalReportComponent';
import CustomAppComponent from '../customappcomponents/customAppComponent';

function ContentLEAF({ app, leaf, colorBackground }) {

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
        else if (leaf.contentType == "html") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <HtmlEditor editable={false} htmlValue={leaf.html} setHtmlValue={null} value={null} onChange={null}></HtmlEditor>
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
        else if (leaf.contentType == "external_report") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <ExternalReportComponent map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }} report={leaf.report}></ExternalReportComponent>
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
        else if (leaf.contentType == "survey") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <SurveyComponent map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }} layer={leaf.table}></SurveyComponent>
            </div>
        }
        else if (leaf.contentType == "schedule") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <ScheduleComponentInit map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }} layer={leaf.table}></ScheduleComponentInit>
            </div>
        }
        else if (leaf.contentType == "custom_app_component") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <CustomAppComponent map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }} 
                custom_app_component={leaf.custom_app_component}
                colorBackground={colorBackground}></CustomAppComponent>
            </div>
        }
        else {
            return <Empty />
        }
    }

    const renderContentMobile = () => {

        if (leaf.contentType == "map") {
            //return <div style={{ width: "100%", height: leaf.height}}> TEMPORAL PARA QUE SE VEA EL MAPA
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
        else if (leaf.contentType == "html") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <HtmlEditor editable={false} htmlValue={leaf.html} setHtmlValue={null} value={null} onChange={null}></HtmlEditor>
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
        else if (leaf.contentType == "survey") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <SurveyComponent map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }} layer={leaf.table}></SurveyComponent>
            </div>
        }
        else if (leaf.contentType == "schedule") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <ScheduleComponentInit map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }} layer={leaf.table}></ScheduleComponentInit>
            </div>
        }
        else if (leaf.contentType == "custom_app_component") {
            return <div style={{ width: "100%", height: leaf.height }}>
                <CustomAppComponent map={{
                    unit: app.idUnt.unitName,
                    permission: leaf.permission,
                    map: leaf.project
                }} custom_app_component={leaf.custom_app_component}></CustomAppComponent>
            </div>
        }
        else {

            return <Empty />
        }
    }

    return (
        <>
            <BrowserView style={{
                display: "flex",
                alignItems: "stretch",
                width: "100%",
                height: "100%"
            }}>
                {renderContentBrowser()}
            </BrowserView>
            <MobileView style={{
                display: "flex",
                alignItems: "stretch",
                width: "100%",
                height: "100%"
            }}>
                {renderContentMobile()}
            </MobileView>
        </>
    );
}

export default ContentLEAF;

