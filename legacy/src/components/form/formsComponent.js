import { forwardRef, useEffect, useRef, useState } from "react";
import ReactDOM from 'react-dom/client';
import { Button, Card, Empty, Form, Modal, Pagination, Row, Space, Tabs, ConfigProvider } from "antd"
import { CloseCircleTwoTone, DownloadOutlined, SaveOutlined } from "@ant-design/icons";
import NotificationComponent from "../utils/NotificationComponent";
import { QgisService } from "../../service/qgisService";
import { getQgisLayerByTypeName, getWMSLayer } from "../../utilities/mapUtils";
import FormComponent from "./formComponent";
import TabPane from "antd/es/tabs/TabPane";
import { useSelector } from "react-redux";
import { generalParams_state } from "../../features/generalParams/generalParamsSlice";
import { getLetterColorForm, getLetterSizeForm, getLetterTypeForm } from "../../utilities/paramsUtils";
import i18next from "i18next";


const FormsComponent = forwardRef(({ map, QGISPRJ, editable, features, mapView, reload, visible, setVisible, setSelectedTab, showInfoSheet, setShowInfoSheet, setLoading }, ref) => {

  const [qgisLayers, setQgisLayers] = useState();

  let processResults = () => {
    let qgisLayersAux = qgisLayers ? { ...qgisLayers } : {}
    //console.log(features)
    //console.log("qgisLayersAux", qgisLayersAux)
    for (let i in features) {
      let f = features[i]
      const featureIdArr = f.id.split(".");
      const TYPENAME = featureIdArr[0];
      //console.log(TYPENAME)
      const FID = featureIdArr[1];
      if (TYPENAME in qgisLayersAux) {
        qgisLayersAux[TYPENAME].features.push(f)
      }
      else {
        qgisLayersAux[TYPENAME] = getQgisLayerByTypeName(QGISPRJ, TYPENAME);//QGISPRJ.layers[TYPENAME]
        //console.log("elemnto", getQgisLayerByTypeName(QGISPRJ, TYPENAME))
        qgisLayersAux[TYPENAME].name = TYPENAME
        qgisLayersAux[TYPENAME].features = [f]
      }
    }
    setQgisLayers(qgisLayersAux)
  }


  useEffect(() => {
    processResults()
  }, [features])

  let renderResults = () => {
    return <LayersResults map={map} qgisLayers={qgisLayers}
      QGISPRJ={QGISPRJ} editable={editable} features={features} mapView={mapView}
      reload={reload} visible={visible} setVisible={setVisible} setSelectedTab={setSelectedTab}
      showInfoSheet={showInfoSheet} setShowInfoSheet={setShowInfoSheet} setLoading={setLoading}
    ></LayersResults>
  }
  return (
    <>
      {features && features.length == 0 && <Empty />}
      {qgisLayers && features && features.length > 0 && renderResults()}
    </>
  );
})

export default FormsComponent;


function LayersResults({ map, qgisLayers, QGISPRJ, editable, features, mapView, reload, visible, setVisible, setSelectedTab, showInfoSheet, setShowInfoSheet, setLoading }) {

  const [items, setItems] = useState([]);
  const state_params = useSelector(generalParams_state)
  const [tab, setTab] = useState(1)
  const [letterSizeForm, setLetterSizeForm] = useState(14)
  const [letterTypeForm, setLetterTypeForm] = useState("Helvetica")
  const [letterColorForm, setLetterColorForm] = useState("#000000")

  let processItems = () => {
    let tabs = []
    let i = 0
    const filteredLayers = Object.fromEntries(
      Object.entries(qgisLayers).filter(
        ([key, value]) => value.WFSCapabilities.allowQuery === true
      )
    );
    
    for (let key in filteredLayers) {
      ++i
      let qgisLayer = filteredLayers[key]
      let nombre = Object.keys(filteredLayers)[tab-1]
      let tabAux = {
        key: String(i),
        label: <div className="reader">{qgisLayer.name.replaceAll("_", " ")}</div>,
        children: nombre==key ? <LayerResult map={map} qgisLayer={qgisLayer}
          QGISPRJ={QGISPRJ} editable={editable} features={features}
          mapView={mapView} reload={reload} visible={visible}
          setVisible={setVisible} showInfoSheet={showInfoSheet} setShowInfoSheet={setShowInfoSheet}
          setLoading={setLoading}
        ></LayerResult> :<div>{i18next.t('common.msg.form.viewNoData')}</div>
      }
      tabs.push(tabAux)
    }
    setItems(tabs)
  }

  useEffect(() => {
    if (state_params.length > 0) {

      let letterSizeForm = getLetterSizeForm(state_params)

      if (letterSizeForm) {
        setLetterSizeForm(letterSizeForm)
      }

      let letterTypeForm = getLetterTypeForm(state_params)

      if (letterTypeForm) {
        setLetterTypeForm(letterTypeForm)
      }

      let letterColorForm = getLetterColorForm(state_params)

      if (letterColorForm) {
        setLetterColorForm(letterColorForm)
      }

    }

  }, [state_params])

  useEffect(() => {
    const primeraClave = Object.keys(qgisLayers)[0];
    if (primeraClave) {
      setSelectedTab(primeraClave)
    }
    processItems()
  }, [qgisLayers])

  useEffect(() => {
    processItems()
  }, [tab])


  return (<>
    {items &&
      <ConfigProvider
        theme={{
          components: {
            Tabs: {
              fontSize: "",
              fontFamily: "",
              colorText: "",
              colorBgContainer: "white",
              colorPrimary: "black",
              colorPrimaryHover: "black",
            },
          },
        }}
      >
        {<Tabs
          type="card"
          tabBarStyle={{ color: letterColorForm, fontFamily: letterTypeForm, fontSize: letterSizeForm + "px" }}
          defaultActiveKey={tab}
          items={items}
          onChange={(e, x) => { setSelectedTab(items[e - 1].label); console.log("ee", e, items[e - 1].label); setTab(e)}} />}
      </ConfigProvider>
    }
  </>)
}

function LayerResult({ map, qgisLayer, QGISPRJ, editable, features, mapView, reload, setModalOpen, visible, setVisible, showInfoSheet, setShowInfoSheet, setLoading }) {
  let layerFeatures = qgisLayer.features

  const [page, setPage] = useState();
  const [feature, setFeature] = useState();
  const formRef = useRef(null);

  let setPageAux = (pageAux) => {
    setPage(pageAux);
    let f = qgisLayer.features[pageAux - 1]
    setFeature(f)
  }

  useEffect(() => {
    setPageAux(1)
  }, [])

  return (
    <>
      {layerFeatures.length > 1 && <Pagination current={page} defaultCurrent={page} pageSize={1} total={layerFeatures.length} onChange={(page, pageSize) => { setPageAux(page) }} />}
      <br></br>
      {feature &&
        <FormComponent
          ref={formRef} QGISPRJ={QGISPRJ} map={map} editable={editable} feature={feature}
          layer={qgisLayer.name} qgisLayer={qgisLayer} mapView={mapView} reload={reload}
          visible={visible} setVisible={setVisible} page={page}
          showInfoSheet={showInfoSheet} setShowInfoSheet={setShowInfoSheet}
          setLoading={setLoading}
        >
        </FormComponent>}
      <br></br>
      {layerFeatures.length > 1 && <Pagination current={page} defaultCurrent={page} pageSize={1} total={layerFeatures.length} onChange={(page, pageSize) => { setPageAux(page) }} />}

    </>
  )
}
