import { Card, Col, Collapse, Row, Tabs } from "antd";
import InputComponet from "../inputs/inputComponet";
import InputRelation from "../inputs/inputRelation";
import { BrowserView, MobileView } from "react-device-detect";
import { getFieldByName } from "../../utilities/mapUtils";
const { Panel } = Collapse;

function QgisTabComponent({ QGISPRJ, map, setFieldsChanged, form, editable, feature, properties, qgisLayer, mapView, reload, tab, hideRelations }) {


    const renderMobileChildrenTabs = (parentTab) => {
        return parentTab.children.map((t, index) => {
            if (t && t.classType == 'QgsAttributeEditorField' && qgisLayer.fields[t.idx].editorWidgetSetup.type != "Hidden") {
                return <Col key={"renderMobileChildrenTabs" + index} span={24}>
                    <QgsAttributeEditorField hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={t}></QgsAttributeEditorField>
                </Col>
            }
            if (t && t.classType == 'QgsAttributeEditorRelation') {
                return <Col key={"renderMobileChildrenTabs" + index} span={24}>
                    <QgsAttributeEditorRelation hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={t}></QgsAttributeEditorRelation>
                </Col>
            }
            if (t && t.classType == 'QgsAttributeEditorContainer') {
                return renderMobileChildrenTabs(t)
            }
        })
    }
    const renderMobile = () => {
        return <Row>
            {tab && tab.classType == 'QgsAttributeEditorField' && getFieldByName(qgisLayer, tab.name)?.editorWidgetSetup.type != "Hidden" &&
                <Col span={24}>
                    <QgsAttributeEditorField hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={tab}></QgsAttributeEditorField>
                </Col>
            }
            {tab && tab.classType == 'QgsAttributeEditorRelation' &&
                <Col span={24}>
                    <QgsAttributeEditorRelation hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={tab}></QgsAttributeEditorRelation>
                </Col>
            }
            {tab && tab.classType == 'QgsAttributeEditorContainer' &&
                renderMobileChildrenTabs(tab)
            }
        </Row>
    }

    const renderBrowser = () => {
        return <Row>
            {tab && tab.classType == 'QgsAttributeEditorField' && getFieldByName(qgisLayer, tab.name)?.editorWidgetSetup.type != "Hidden" &&
                <Col span={24}>
                    <QgsAttributeEditorField hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged}
                        form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView}
                        reload={reload} tab={tab}
                    ></QgsAttributeEditorField>
                </Col>
            }
            {tab && tab.classType == 'QgsAttributeEditorRelation' &&
                <Col span={24}>
                    <QgsAttributeEditorRelation hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={tab}></QgsAttributeEditorRelation>
                </Col>
            }
            {tab && tab.classType == 'QgsAttributeEditorContainer' &&
                <Col span={24}>
                    <QgsAttributeEditorContainer hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged}
                        form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView}
                        reload={reload} tab={tab} isMainTab={true}
                    ></QgsAttributeEditorContainer>
                </Col>
            }
        </Row>
    }

    return (
        <>
            <BrowserView>
                {renderBrowser()}
            </BrowserView>
            <MobileView>
                {renderMobile()}
            </MobileView>

        </>
    );
}

export default QgisTabComponent;


function QgsAttributeEditorField({ hideRelations, QGISPRJ, map, setFieldsChanged, form, editable, feature, properties, qgisLayer, mapView, reload, tab }) {


    let field = getFieldByName(qgisLayer, tab.name)
    let hideColumns = []
    if (qgisLayer && qgisLayer.customProperties && qgisLayer.customProperties.URBEGIS_HIDE_FORM_COLUMNS) {
        try {
            hideColumns = JSON.parse(qgisLayer.customProperties.URBEGIS_HIDE_FORM_COLUMNS)
        }
        catch (e) { }
    }

    const renderField = () => {
        if (field.editorWidgetSetup.type == "Hidden") return;
        if (hideColumns.indexOf(field.name) >= 0) return;
        else {
            return <>
                <InputComponet hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged}
                    form={form} feature={feature} properties={properties} field={field} qgisLayer={qgisLayer}
                    editable={editable}
                ></InputComponet>
            </>
        }
    }

    return (
        <>
            {
                renderField()
            }
        </>
    );
}

function QgsAttributeEditorContainer({ hideRelations, QGISPRJ, map, setFieldsChanged, form, editable, feature, properties, qgisLayer, mapView, reload, tab, isMainTab }) {

    return (
        <>
            {
                tab && tab.isGroupBox == 'true' &&
                <>
                    <QgsAttributeEditorContainerGroupBox
                        hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form}
                        editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload}
                        tab={tab} isMainTab={isMainTab}
                    ></QgsAttributeEditorContainerGroupBox>
                </>
            }
            {
                tab && tab.isGroupBox != 'true' &&
                <>
                    <QgsAttributeEditorContainerGroupTab hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={tab} isMainTab={isMainTab}></QgsAttributeEditorContainerGroupTab>
                </>
            }</>)
}

function QgsAttributeEditorContainerGroupBox({ hideRelations, QGISPRJ, map, setFieldsChanged, form, editable, feature, properties, qgisLayer, mapView, reload, tab, isMainTab }) {
    //Calculamos el ancho de cada columna
    let span = 24 / tab.columnCount



    return (


        <>
            <Card
                size="small"
                title={tab.showLabel == 'true' ? tab.name : ""}
                bordered={true}
                style={{}}>

                <Row>
                    {tab && tab.children.map((tab, index) => {

                        if (tab && tab.classType == 'QgsAttributeEditorField' && qgisLayer.fields[tab.idx].editorWidgetSetup.type != "Hidden") {
                            return <Col key={"QgsAttributeEditorField" + index} span={span}>
                                <QgsAttributeEditorField
                                    hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable}
                                    feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={tab} span={span}
                                ></QgsAttributeEditorField>
                            </Col>
                        }
                        if (tab && tab.classType == 'QgsAttributeEditorRelation') {
                            return <Col key={"QgsAttributeEditorRelation" + index} span={span}>
                                <QgsAttributeEditorRelation hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={tab}></QgsAttributeEditorRelation>
                            </Col>
                        }
                        if (tab && tab.classType == 'QgsAttributeEditorContainer') {
                            return <Col key={"QgsAttributeEditorContainer" + index} span={span}>
                                <QgsAttributeEditorContainer hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={tab} isMainTab={false}></QgsAttributeEditorContainer>
                            </Col>
                        }
                    })}
                </Row>
            </Card>
        </>
    );
}

function QgsAttributeEditorContainerGroupTab({ hideRelations, QGISPRJ, map, setFieldsChanged, form, editable, feature, properties, qgisLayer, mapView, reload, tab, isMainTab }) {

    //Calculamos el ancho de cada columna
    let span = 24 / tab.columnCount

    const renderMainTab = () => {
        //Si ya hemos renderizado el tab, no contiuamos
        if (tab.isRendered) return;

        //Recuperamos todos los tab seguidos
        let tabs = [];
        let findContinuous = false;
        for (var i in qgisLayer.editFormConfig.tabs) {
            let tabAux = qgisLayer.editFormConfig.tabs[i];
            if (!findContinuous) {
                if (tabAux == tab) {
                    findContinuous = true;
                    tabAux.isRendered = true;
                    tabs.push(tabAux);
                }
            }
            else {
                if (tabAux.classType == 'QgsAttributeEditorContainer' && tabAux.isGroupBox != 'true') {
                    tabAux.isRendered = true;
                    tabs.push(tabAux);
                }
            }

        }
        let items = []
        for (var i in tabs) {
            let tabAux = tabs[i];
            //console.log("tabaux", tabAux.name)
            items.push(
                {
                    key: i,
                    label: tabAux.name,
                    children: <>
                        <Row>
                            {
                                tabAux.children.map((tab, index) => {

                                    if (tab && tab.classType == 'QgsAttributeEditorField') {
                                        return <Col key={"QgsAttributeEditorField" + index} span={span}>
                                            <QgsAttributeEditorField hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={tab}></QgsAttributeEditorField>
                                        </Col>
                                    }
                                    if (tab && tab.classType == 'QgsAttributeEditorRelation') {
                                        return <Col key={"QgsAttributeEditorRelation" + index} span={span}>
                                            <QgsAttributeEditorRelation hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={tab}></QgsAttributeEditorRelation>
                                        </Col>
                                    }
                                    if (tab && tab.classType == 'QgsAttributeEditorContainer') {
                                        return <Col key={"QgsAttributeEditorContainer" + index} span={span}>
                                            <QgsAttributeEditorContainer hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={tab} isMainTab={false}></QgsAttributeEditorContainer>
                                        </Col>
                                    }
                                })
                            }
                        </Row>
                    </>,
                }
            )
        }
        return <>
            <Card
                size="small"
                bordered={true}
                style={{}}>
                <Tabs defaultActiveKey="0" items={items} />
            </Card>
        </>
    }

    const renderSecondaryTab = () => {
        //console.log("secundaria")
        return <Collapse defaultActiveKey={[tab.name]}>
            <Panel header={tab.name} key={tab.name}>
                <Row>
                    {
                        tab.children.map((tab, index) => {

                            if (tab && tab.classType == 'QgsAttributeEditorField') {
                                return <Col key={"QgsAttributeEditorField" + index} span={span}>
                                    <QgsAttributeEditorField hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={tab}></QgsAttributeEditorField>
                                </Col>
                            }
                            if (tab && tab.classType == 'QgsAttributeEditorContainer') {
                                return <Col key={"QgsAttributeEditorContainer" + index} span={span}>
                                    <QgsAttributeEditorContainer hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} editable={editable} feature={feature} properties={properties} qgisLayer={qgisLayer} mapView={mapView} reload={reload} tab={tab} isMainTab={false}></QgsAttributeEditorContainer>
                                </Col>
                            }
                        })
                    }
                </Row>
            </Panel>
        </Collapse>
    }

    const renderTab = () => {
        if (isMainTab) {
            return renderMainTab();
        }
        else {
            return renderSecondaryTab();
        }
    }

    //Calculamos el ancho de cada columna
    return (
        <>
            {renderTab()}
        </>
    );
}


function QgsAttributeEditorRelation({ hideRelations, QGISPRJ, map, setFieldsChanged, form, editable, feature, properties, qgisLayer, mapView, reload, tab }) {
    //console.log("QgsAttributeEditorRelation")
    const renderField = () => {
        return <>
            <InputRelation hideRelations={hideRelations} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} feature={feature} properties={properties} qgisLayer={qgisLayer} editable={editable} mapView={mapView} reload={reload} tab={tab}></InputRelation>
        </>
    }

    return (
        <>
            {!hideRelations &&
                renderField()
            }
        </>
    );
}
