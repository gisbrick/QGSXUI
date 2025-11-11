import { useState, useRef, useCallback, useEffect } from "react";
import { Button, Collapse, ConfigProvider, Modal, Space } from "antd";
import i18next from "i18next";
import ReactDOM from 'react-dom/client';

import FormComponent from "./formComponent";
import NotificationComponent from "../utils/NotificationComponent";
import { CancelAudio } from "../../utilities/pageContentReader";
import { BrowserView, MobileView } from "react-device-detect";
import Draggable from "react-draggable";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { features_state, resetFeatures } from "../../features/features/featuresSlice";
import { QgisService } from "../../service/qgisService";

const { Panel } = Collapse;

function FormComponentModal({ QGISPRJ, map, editable, feature, layer, qgisLayer, mapView, reload, visible, setVisible, showInfoSheet, setShowInfoSheet, setLoading }) {
  
  const dispatch = useDispatch();
  const featuresState = useSelector(features_state)

  const formRef = useRef(null);
  const draggleRef = useRef(null);
  const staticRef = useRef(null);
  const modalContenedor = useRef(null);

  const [open, setOpen] = useState(true);
  const [widthModal, setWidthModal] = useState("100%")
  const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const [disabled, setDisabled] = useState(true);
  const [limits, setLimits] = useState()
  const [expandContent, setExpandContent] = useState(["1"]);
  const [showModalConfirmExit, setShowModalConfirmExit] = useState(false)

  const isNewFeature = feature == null || feature == undefined || feature.id == null || feature.id == undefined;

  const handleCancel = () => {
    if (formRef.current) {
      formRef.current.imperativeHandleCancel()
    } else {
      setVisible(false);
    }
    window.mouseOverButton = false
    dispatch(resetFeatures())
  }


  const setVisibleAux = (value) => {
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


  const getTitle = () => {
    if (editable) {
      if (!isNewFeature) {
        return i18next.t('common.actions.edit.title', { layername: layer })
      }
      else {
        return i18next.t('common.actions.create.title', { layername: layer })
      }
    }
    else {
      return i18next.t('common.actions.view.title', { layername: layer })
    }
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

  const changesFormData = () => {
    //buscar si ha habido cambios
    let changedData = featuresState.find((data) => data.modified == true)

    /* if (changedData != undefined) {
      //ha habido cambios y se abre la modal de confirmacion
      setShowModalConfirmExit(true)
      console.log("actua")
    } else {
      //no ha habido cambios y se resetea el estado de features_state
      setShowModalConfirmExit(false)
      console.log("actua2")
      dispatch(resetFeatures())
      handleCancel()
    } */
    handleCancel()
  }

    //funcion que actualiza los datos
    /* const updateData = () => {
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
    } */

  const render = () => {
    return <>
      <div ref={modalContenedor}>
        <Modal
          title={
            (<>
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
                <><div className="reader" style={{ fontSize: "18px" }}>{getTitle().replaceAll("_", " ")}</div></>
              </div></>
            )
          }
          maskClosable={false}
          open={open}
          footer={null}
          onCancel={() => {
            CancelAudio();
            changesFormData();
          }}
          className="formComponentModal"
          mask={false}
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
                  <FormComponent
                    ref={formRef} QGISPRJ={QGISPRJ} map={map} editable={editable} feature={feature} layer={layer}
                    qgisLayer={qgisLayer} mapView={mapView} reload={reload} visible={visible} setVisible={setVisibleAux}
                    showInfoSheet={showInfoSheet} setShowInfoSheet={setShowInfoSheet} setLoading={setLoading}>
                  </FormComponent>
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
        open={showModalConfirmExit} onOk={() => { /*updateData()*/}} onCancel={() => { handleCancel() }}>
        <p className="reader">{i18next.t('common.msg.pendingSave.content')} </p>
      </Modal>
    </>
  }

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


  useEffect(() => {
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

export default FormComponentModal;
