import { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from 'react-dom/client';
import { Button, Modal, Space, Collapse, ConfigProvider } from "antd";
import i18next from "i18next";
import { useDispatch, useSelector } from "react-redux";
import Draggable from "react-draggable";
import { DownOutlined, UpOutlined, CustomerServiceOutlined } from "@ant-design/icons";
import { BrowserView, MobileView } from 'react-device-detect';

import FormsComponent from "./formsComponent";
import { getQgisLayerByTypeName } from "../../utilities/mapUtils";
import { features_state, resetFeatures } from "../../features/features/featuresSlice";
import { QgisService } from "../../service/qgisService";
import { getLastPropertiesReusable, refreshWMSLayer } from "../../utilities/mapUtils";
import NotificationComponent from "../utils/NotificationComponent";
import { CancelAudio } from "../../utilities/pageContentReader";

const { Panel } = Collapse;

function FormsComponentModal({ map, QGISPRJ, mapView, editable, features, reload, visible, setVisible, showInfoSheet, setShowInfoSheet, setLoading }) {

  const formsRef = useRef(null);

  const dispatch = useDispatch();
  const featuresState = useSelector(features_state)

  const [showModalConfirmExit, setShowModalConfirmExit] = useState(false)
  const [selectedTab, setSelectedTab] = useState("")

  const [widthModal, setWidthModal] = useState("100%")
  const [disabled, setDisabled] = useState(true);
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });



  const draggleRef = useRef(null);
  const panelRef = useRef(null)
  const staticRef = useRef(null);
  const modalContenedor = useRef(null);

  const [limits, setLimits] = useState()

  const [expandContent, setExpandContent] = useState(["1"]);


  const handleClick = useCallback(event => {
    const { key, target } = event;
    if (target.className == "ant-modal-wrap") {
      renderNotification()
    }
  }, []);

  const renderNotification = () => {
    const messages = ReactDOM.createRoot(document.getElementById('messages'));
    messages.render(
      <NotificationComponent type="error" text="invalidEvent" description={"Cierre la ficha de información"}></NotificationComponent>
    );

  }

  /**
   * La función sirve para fijar los límites de la pantalla por los que la modal se puede arrastrar.
   * 
   * @param {*} _event 
   * @param {*} uiData 
   * @returns 
   */
  const onStart = (_event, uiData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };

  const onStop = (_event, uiData) => {
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setLimits(uiData)
  }


  const handleCancel = () => {
    if (formsRef.current) {
      formsRef.current.imperativeHandleCancel()
    } else {
      setVisible(false);
    }
    //console.log("actua en formsModal")
    //
    deleteFormGeometry();
    dispatch(resetFeatures())

  }


  const setVisibleAux = (value) => {
    //console.log("cierre", value)
    setVisible(value);
    deleteFormGeometry();
  }

  const deleteFormGeometry = () => {
    if (mapView && mapView.formGraphicsLayer) {
      let layers = mapView.formGraphicsLayer.getLayers()
      for (let i in layers) {
        mapView.formGraphicsLayer.removeLayer(layers[i])
      }
    }
  }

  const getTitle = (title) => {
    return <div className="reader" style={{fontSize: "18px"}}>{i18next.t('common.msg.form.view')}</div>
  }

  const changesFormData = () => {
    //buscar si ha habido cambios
    let changedData = featuresState.find((data) => data.modified == true)
    //console.log("changeddata", changedData)

    if (changedData) {
      //ha habido cambios y se abre la modal de confirmacion
      setShowModalConfirmExit(true)
    } else {
      //no ha habido cambios y se resetea el estado de features_state
      setShowModalConfirmExit(false)
      dispatch(resetFeatures())
      handleCancel();
    }
  }

  //funcion que actualiza los datos
  const updateData = () => {
    let changedLayerData = featuresState.filter((data) => data.modified == true)
    //console.log("cambiados", changedLayerData)

    //realizar el guardado de datos en base de datos
    //controlar el error
    if (changedLayerData.length > 0) {
      changedLayerData.forEach(layer => {
        let changedFeaturesData = layer.features.filter((feature) => feature.modified == true)
        let layerName = layer.layer
        let qgisLayer = QGISPRJ.layers[layerName]
        //console.log("qgisLayer", qgisLayer)
        changedFeaturesData.forEach(feature => {
          let idFeature = layerName + "." + feature.id
          let featureAux = features.find((feature) => feature.id == idFeature)
          //console.log("featureAux", featureAux)
          let properties = feature.properties
          //console.log("properties", properties)
          let geometry = featureAux.geometry
          QgisService.UPDATEFEATURE(map, qgisLayer, featureAux, properties, geometry)
            .then((data) => {
              //Guardamos en la layer las propiedades de la última inserción, 
              //para poder emplearlas en aquellos campos que queranos documentar automáticamente en base al último valo
              qgisLayer.lastInsertProperties = getLastPropertiesReusable(qgisLayer, properties);
              //Actualizamos las propiedades de la feature en la vista
              if (featureAux) {
                featureAux.properties = properties;
                featureAux.geometry = geometry;
              }

              //Refrescamos el mapa
              if (mapView) refreshWMSLayer();

              if (reload) reload();

              //Cerramos la modal si es un INSERT
              if (!featureAux || !featureAux.id) {
                //console.log("setVisible handleOkAndExitFormValidated")
                setVisible(false)
              }

              //Informamos de que se han actualizado corréctamente los datos
              const messages = ReactDOM.createRoot(document.getElementById('messages'));
              messages.render(
                <NotificationComponent type="success" text="update"></NotificationComponent>
              );
              //setFieldsChanged(false);
              //handleConfirmCancel();
              //setSaving(false);
              setShowModalConfirmExit(false)
              setVisible(false)
              dispatch(resetFeatures())
            })
            .catch(err => {
              console.log("ERROR", err);
              //setSaving(false);
            });
        });


      });
    }

    setShowModalConfirmExit(false)
  }


  const render = () => {

    let width = 180 * 3 + 50
    for (let i in features) {
      let f = features[i]
      const featureIdArr = f.id.split(".");
      const TYPENAME = featureIdArr[0];
      const FID = featureIdArr[1];
      let qgisLayer = getQgisLayerByTypeName(QGISPRJ, TYPENAME);
      //actúa aquí el reajuste de la ventana modal según el nº de fields de la entidad que se muestran
      if (qgisLayer.name == selectedTab) {
        width = qgisLayer.editFormConfig.tabs.length > 3 ? 180 * Math.ceil(qgisLayer.editFormConfig.tabs.length / 3) + 50 + "px" : "550px"
      }
      if (qgisLayer) {
        if (qgisLayer.customProperties.URBEGIS_MODAL_WIDTH && parseInt(qgisLayer.customProperties.URBEGIS_MODAL_WIDTH) > width) {
          width = parseInt(qgisLayer.customProperties.URBEGIS_MODAL_WIDTH)

        }
      }
    }
    return <>
      <div ref={modalContenedor}>
        <Modal
          title={(<>
            <div
              style={{
                width: widthModal,
                cursor: draggleRef.current ? 'move' : "",
                display: "flex"
              }}
              onMouseOver={() => {
                if (disabled) {
                  setDisabled(false);
                }
              }}
              onMouseOut={() => {
                setDisabled(true);
              }}

              onFocus={() => { }}
              onBlur={() => { }}
            // end
            >
              <button
                style={{ backgroundColor: "white", border: "none", paddingRight: "10px" }}
                onClick={(e) => {
                  e.preventDefault();

                  if (expandContent.length == 0) {
                    setExpandContent(["1"])
                  }
                  else {
                    setExpandContent([]);
                  }
                }}>
                {expandContent.length == 0 ? <DownOutlined /> : <UpOutlined />}
              </button>
              {getTitle()}
            </div></>
          )}
          maskClosable={false}
          open={visible}
          className="formComponentModal"
          footer={null}
          mask={false}
          onCancel={() => {
            CancelAudio()
            changesFormData();
          }}
          modalRender={(modal) => (
            <>
              <BrowserView>
                <Draggable
                  disabled={disabled}
                  bounds={bounds}
                  nodeRef={draggleRef}
                  onStart={(event, uiData) => onStart(event, uiData)}
                  onStop={(event, uiData) => onStop(event, uiData)}
                >
                  <div ref={draggleRef}>
                    {modal}
                  </div>
                </Draggable>
              </BrowserView>
              <MobileView>
                <div ref={staticRef}>{modal}</div>
              </MobileView>
            </>

          )}
        >
          <ConfigProvider
            theme={{
              components: {
                Collapse: {
                  padding: "0px",
                  colorBorder: "white"
                },
              },
            }}
          >
            <Collapse activeKey={expandContent}>
              <Panel
                onChange={() => setExpandContent((prev) => [1])}
                showArrow={false}
                key="1"
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ display: 'flex' }}>
                  <FormsComponent
                    ref={formsRef} map={map} QGISPRJ={QGISPRJ} editable={editable} features={features}
                    mapView={mapView} reload={reload} visible={visible} setVisible={setVisibleAux}
                    setSelectedTab={setSelectedTab} showInfoSheet={showInfoSheet}
                    setShowInfoSheet={setShowInfoSheet} setLoading={setLoading}>
                  </FormsComponent>
                  <div style={{ textAlign: "center" }} >
                    <Button type="primary" onClick={() => { CancelAudio(); changesFormData() }}><div className="reader">{i18next.t("common.actions.exit.name")}</div></Button>
                  </div>
                </Space>
              </Panel>
            </Collapse>
          </ConfigProvider>
        </Modal>

      </div>


      <Modal title={<div className="reader">{i18next.t('common.msg.pendingSave.title')}</div>}
        okText={<div className="reader">{i18next.t('common.actions.yes.name')}</div>}
        cancelText={<div className="reader">{i18next.t('common.actions.no.name')}</div>}
        open={showModalConfirmExit} onOk={() => { updateData() }} onCancel={() => { handleCancel(); console.log("modal cancel") }}>
        <p className="reader">{i18next.t('common.msg.pendingSave.content')} </p>
      </Modal>

    </>
  }

  useEffect(() => {
    console.log("forms")
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);

    };
  }, [handleClick]);

  useEffect(() => {
    if (draggleRef.current) {
      //console.log("clientWidth", draggleRef?.current.clientWidth)
      //console.log("offsetWidth", draggleRef.current.offsetWidth)
      setWidthModal(draggleRef.current.clientWidth + "px")
    }
    if (staticRef.current) {
      setWidthModal(staticRef.current.clientWidth + "px")
    }
  }, [])

  return (
    <>
      {render()}
    </>
  );
}

export default FormsComponentModal;
