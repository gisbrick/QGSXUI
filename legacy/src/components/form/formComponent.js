import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from "react";
import ReactDOM from 'react-dom/client';
import { Button, Card, Form, List, Modal, Row, Space, Spin, Tooltip, Tour } from "antd"
import i18next from "i18next";
import { CloseCircleTwoTone, CloseOutlined, FileAddOutlined, SaveOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";

import NotificationComponent from "../utils/NotificationComponent";
import { QgisService } from "../../service/qgisService";
import { getDefaultProperties, getLastPropertiesReusable, getWMSLayer } from "../../utilities/mapUtils";
import FormToolbarComponent from "./formToolbarComponent";
import { drawSelectionFeature } from "../../utilities/mapDrawUtils";
import { removeFeature } from "../../features/features/featuresSlice";
import FormViewComponent from "./formViewComponent";
import FormEditComponent from "./formEditComponent";
import MediaFormComponentModalInput from "../media/mediaFormComponentModalInput";
import { MediaService } from "../../service/mediaService";


const FormComponent = forwardRef(({ QGISPRJ, map, editable: editableAux, feature: featureAux, qgisLayer, mapView, reload, visible, setVisible, page, showInfoSheet, setShowInfoSheet, setLoading }, ref) => {

  const isNewFeature = featureAux == null || featureAux == undefined || featureAux.id == null || featureAux.id == undefined;

  const [form] = Form.useForm();
  const [fieldsChanged, setFieldsChanged] = useState(false);
  const [feature, setFeature] = useState(false);
  const [showModalConfirmExit, setShowModalConfirmExit] = useState(false);
  const [editable, setEditable] = useState();
  const [saving, setSaving] = useState();
  const [showFormView, setShowFormView] = useState(showInfoSheet)
  const [isNew, setIsNew] = useState(isNewFeature)
  const [habilitarBotonGuardar, setHabilitarBotonGuardar] = useState(false)

  const [stepsRoot, setStepsRoot] = useState([])
  const [tourStepsToolbars, setTourStepsToolbars] = useState([]);
  const [tourOpen, setTourOpen] = useState(false);

  const [files, setFiles] = useState([])
  const [viewInsert, setViewInsert] = useState();


  const dispacth = useDispatch()

  const botonSave = useRef(null)
  const botonExit = useRef(null)

  //Hacemos una copia de las propiedades
  /*
  let propsAux = featureAux ? { ...featureAux.properties } : {};
  let geomAux = featureAux ? { ...featureAux.geometry } : getGeometry();*/

  let [properties, setProperties] = useState();
  let [geometry, setGeometry] = useState();

  let media = null;
  if (qgisLayer && qgisLayer.customProperties && qgisLayer.customProperties.URBEGIS_MEDIA) {
    media = JSON.parse(qgisLayer.customProperties.URBEGIS_MEDIA)
  }

  let getGeometry = () => {
    if (!mapView || !mapView.editGeometry) return null;
    let out = {
      "type": qgisLayer.wkbType_name,
      "coordinates": getCoordinates()
    }
    return out;
  }

  let getCoordinates = () => {
    if (mapView.editGeometry.getLatLng) {
      let latLng = mapView.editGeometry.getLatLng();
      return [latLng.lat, latLng.lng]
    }
    if (mapView.editGeometry.getLatLngs) {
      return mapView.editGeometry.getLatLngs();
    }
  }

  let insertFile = () => {
    setViewInsert(true)
  }

  //Dibujamos la geometría de la feature en el mapa
  const drawFormGeometry = () => {
    //Iniciamos la capa de gráficos y la añadimos al mapa
    if (!mapView.formGraphicsLayer) {
      mapView.formGraphicsLayer = window.L.featureGroup([]);
      mapView.addLayer(mapView.formGraphicsLayer);
    }
    else {
      let layers = mapView.formGraphicsLayer.getLayers()
      for (let i in layers) {
        mapView.formGraphicsLayer.removeLayer(layers[i])
      }
    }
    drawSelectionFeature(mapView, mapView.formGraphicsLayer, featureAux, "formGraphicsLayer", {}, qgisLayer)

  }


  const reloadForm = async () => {
    //console.log("reloadForm")
    //let propsAux = featureAux && "properties" in featureAux ? { ...featureAux.properties } : {};
    let propsAux = isNewFeature ? featureAux.properties ? featureAux.properties : {} : { ...featureAux.properties }
    let geomAux = isNewFeature ? getGeometry() : { ...featureAux.geometry };
    //Recuperamos las propiedades por defecto
    //console.log("es nueva",isNewFeature)
    //console.log("geomAux", geomAux)
    let defaultProperties = await getDefaultProperties(qgisLayer, geomAux, isNewFeature)
      .then((response) => {
        //console.log("response", response)
        return response
      })
      .catch((error) => console.log("error", error))

   console.log("qgisLayer", qgisLayer)
    console.log("propsAux", propsAux)
    console.log("defaultProperties", defaultProperties)
    for (let key in defaultProperties) {
      //console.log("key", key)
      //console.log("propertie", defaultProperties[key])
      propsAux[key] = defaultProperties[key];
    }

    setProperties(propsAux)
    setGeometry(geomAux)
    setEditable(editableAux)
    //Si es un nbuevo elemento (insert), habilitamos desde el primer momento el botón de guardar
    if ((!featureAux || !featureAux.id) && isNew) {
      //setFieldsChanged(true)
      setHabilitarBotonGuardar(true)
    }
    //console.log("defaultProperties", defaultProperties)
    //console.log("propAux", propsAux)
    //console.log("feature en formComponeent", { ...featureAux })
    setFeature({ ...featureAux })
    form.setFieldsValue(propsAux);

    if (mapView && qgisLayer && qgisLayer.has_geometry && featureAux && featureAux.id) {
      drawFormGeometry();
    }
  }

  const reloadData = () => {
    //console.log("reloaddata")
    //Volvemos a cargar la feature desde el servicio, ya que no es nueva
    //console.log("reloadData")
    QgisService.WMSFEATURE(map, featureAux)
      .then((data) => {
        //console.log("data en reloaddata", data)
        if (data.features && data.features.length > 0) {//SIEMPRE DEBERIA DE SER 1   
          featureAux = { ...data.features[0] };
          //console.log("feature aux", featureAux)
          reloadForm();
        }
        else {
          reloadForm();
        }

      })
  }

  const refreshWMSLayer = async () => {
    //console.log("refreshWMSLayer")
    if (mapView.wmsLayer) {
      //mapView.wmsLayer.wmsParams.random =  Math.random() //Con esto evitamos que el navegador cachee las imágenes
      setTimeout(async function () {
        mapView.wmsLayer.remove();
        var wmsLayer = await getWMSLayer(mapView);
        wmsLayer.addTo(mapView);
        mapView.wmsLayer = wmsLayer;
      }, 100);
    }
  }

  const handleOk = () => {
    //console.log("handleOk")
    form.validateFields().then((value) => {
      //console.log("values", value)
      handleOkFormValidated()
    }).catch((err) => {
      let errors = []
      for (let i in err.errorFields) {
        for (let n in err.errorFields[i].errors) {
          errors.push(err.errorFields[i].errors[n])
        }
      }
      //Informamos dde que algunos valores no son válidos      
      const messages = ReactDOM.createRoot(document.getElementById('messages'));
      messages.render(
        <NotificationComponent type="error" text="invalidFields" description={errors.join('; ')}></NotificationComponent>
      );

    })
  }
  const handleOkFormValidated = () => {

    setSaving(true);

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
        /*if (!featureAux || !featureAux.id) {
          //console.log("setVisible handleOkFormValidated")
          setVisible(false)
        }*/

        //setSaving(false);

        //Informamos de que se han actualizado corréctamente los datos
        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        messages.render(
          <>
            <NotificationComponent type="success" text="update"></NotificationComponent>
            {data.code && data.message && data.code == "202" && data.message != "" &&
              <NotificationComponent type="success" text="email"></NotificationComponent>
            }
          </>

        );
        setFieldsChanged(false)
        setIsNew(false)
        if (featureAux.id) {
          dispacth(removeFeature(featureAux))
        }
        return data
      })
      .then((data) => {
        let feature = { "id": qgisLayer.name + "." + data.fid }
        if (files.length > 0) {
          let arrayPromises = []
          files.forEach((file) => {
            arrayPromises.push(MediaService.CREATE(map, feature, file))
          })
          Promise.all(arrayPromises)
            .then(() => {
              //Informamos de que se han actualizado corréctamente los datos
              const messages = ReactDOM.createRoot(document.getElementById('messages'));
              messages.render(
                <NotificationComponent type="success" text="insertMedia"></NotificationComponent>
              );
              setSaving(false)
              //console.log("guardado correcto de media")
            })
            .catch(err => {
              console.log("ERROR", err);
              setSaving(false);
            })
        } else {
          setSaving(false)
        }
      })
      .catch(err => {
        console.log("ERROR", err);
        //Informamos dde que algunos valores no son válidos      
        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        messages.render(
          <NotificationComponent type="error" text="transaction" description={err.join('; ')}></NotificationComponent>
        );
        setSaving(false);
      });

  }

  const handleOkAndExit = () => {
    //console.log("handleOkAndExit")
    //Cerramos la modal de confirmación
    setShowModalConfirmExit(false)

    form.validateFields().then((value) => {
      handleOkAndExitFormValidated()
    }).catch((err) => {
      let errors = []
      for (let i in err.errorFields) {
        for (let n in err.errorFields[i].errors) {
          errors.push(err.errorFields[i].errors[n])
        }
      }
      //Informamos dde que algunos valores no son válidos      
      const messages = ReactDOM.createRoot(document.getElementById('messages'));
      messages.render(
        <NotificationComponent type="error" text="invalidFields" description={errors.join('; ')}></NotificationComponent>
      );

    })
  }

  const handleOkAndExitFormValidated = () => {
    //console.log(" handleOkAndExitFormValidated")
    setSaving(true);

    QgisService.UPDATEFEATURE(map, qgisLayer, featureAux, properties, geometry)
      .then((data) => {
        //console.log("data en handleOkAndExitFormValidated", data)
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
          <>
            <NotificationComponent type="success" text="update"></NotificationComponent>
            {data.code && data.message && data.code == "202" && data.message != "" &&
              <NotificationComponent type="success" text="email"></NotificationComponent>
            }
          </>
        );
        setFieldsChanged(false);
        setIsNew(false)
        handleConfirmCancel();
        if (featureAux.id) {
          dispacth(removeFeature(featureAux))
        }
        return data
      })
      //Introducir un then para guardar los archivos multimedia
      // Se debe pasar el id devuelto en la respuesta y usar los servicios de guardado de multimedia.
      .then((data) => {
        let feature = { "id": qgisLayer.name + "." + data.fid }
        if (files.length > 0) {
          let arrayPromises = []
          files.forEach((file) => {
            arrayPromises.push(MediaService.CREATE(map, feature, file))
          })
          Promise.all(arrayPromises)
            .then(() => {
              const messages = ReactDOM.createRoot(document.getElementById('messages'));
              messages.render(
                <NotificationComponent type="success" text="insertMedia"></NotificationComponent>
              );
              setSaving(false)
              //console.log("guardado correcto de media")
            })
            .catch(err => {
              console.log("ERROR", err);
              setSaving(false);
            })
        } else {
          setSaving(false)
        }
      })
      .catch(err => {
        console.log("ERROR", err);
        //Informamos dde que algunos valores no son válidos      
        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        messages.render(
          <NotificationComponent type="error" text="transaction" description={err.join('; ')}></NotificationComponent>
        );
        setSaving(false);
      });
  }

  const handleCancel = () => {
    //console.log("handleCancel")
    //Hemos entrado ya en modo edición, por lo que podemos cerrar la ventana al salir
    if (editable == editableAux) {
      //console.log("es editable")
      if (fieldsChanged) {
        //console.log("Salida con cambios de la lista")
        setShowModalConfirmExit(true);
      }
      else {
        handleConfirmCancel();
        //setEditable(!editable)
        setVisible(false)
        //console.log("Salida sin cambios de la lista")
      }
    }
    //Hemos conmutado la edición, por lo que lo que tenemos que hacer, es volver a conmutarla
    else {
      if (fieldsChanged) {
        //console.log("salida con cambios del mapa")
        setShowModalConfirmExit(true);
      } else {
        //console.log("salida sin cambios del mapa")
        setEditable(!editable)
        setVisible(false)
        reloadData()
      }
    }
  }


  const loadHelpsteps = () => {
    let steps = []

    if (editable && fieldsChanged) {
      steps.push({
        title: i18next.t('common.tools.help.form.save.button.title'),
        description: i18next.t('common.tools.help.form.save.button.description'),
        //placement: 'top',
        target: () => botonSave.current,
      })
    }

    if (editable) {
      steps.push({
        title: i18next.t('common.tools.help.form.exit.button.title'),
        description: i18next.t('common.tools.help.form.exit.button.description'),
        //placement: 'top',
        target: () => botonExit.current,
      })
    }
    setStepsRoot(steps)
  }


  const getTourSteps = () => {
    return tourStepsToolbars.concat(stepsRoot)
  }

  useEffect(() => {

    if (!featureAux || !featureAux.id) {
      console.log("reloadform para introducir datos")
      reloadForm();
    }
    else {
      console.log("realoaddata para editar datos")
      reloadData();
    }
  }, [featureAux])


  useEffect(() => {
  }, [setVisible])


  useEffect(() => { loadHelpsteps() }, [editable, fieldsChanged])


  /**
   * Se cierra la ventana modal de confirmación primero.
   * Después se identifica si la acción proviene de la form de mapa o de la form de lista. Esto es gracias a editableAux
   * En lista es true y en mapa es false
   */
  const handleConfirmCancel = () => {
    setShowModalConfirmExit(false)
    //form mapa
    if (setVisible && !editableAux) {
      setEditable(!editable)
    }
    //form lista
    if (setVisible && editableAux) {
      setVisible(false);
    }
  }

  useImperativeHandle(ref, () => ({
    imperativeHandleCancel() {
      handleCancel();
    }
  }), [handleCancel]);


  //Reseteamos todos los tabs prinicpales del form para que se vuelvan a pintar
  if (qgisLayer?.editFormConfig) qgisLayer.editFormConfig.tabs.map((tab) => {
    //console.log("resetea")
    if (tab.isRendered) tab.isRendered = false;
  });

  const removeFile = (index) => {
    let arrayAux = [...files]
    if (index > -1) {
      arrayAux.splice(index, 1);
    }
    setFiles(arrayAux)
  }


  return (
    <>
      {properties &&
        <Card
          size="small"
          bordered={true}
          style={{ width: "100%" }}>
          <Form
            layout={"vertical"}
            disabled={!editable}
            onFieldsChange={(field, allFields) => {
              //Actualizamos el valor, para que no haya que cambiar el foco del input para que se actualice
              if (field.length > 0) properties[field[0].name[0]] = field[0].value;
              setProperties(properties)
              setFieldsChanged(true);
              setHabilitarBotonGuardar(true)
            }}
            form={form}>
            {<Form.Item style={{ marginleft: 'auto' }}>
              <Row justify={"end"}>
                <Space style={{}}>
                  <FormToolbarComponent
                    QGISPRJ={QGISPRJ} map={map} editable={editable} setEditable={setEditable} feature={feature}
                    qgisLayer={qgisLayer} mapView={mapView} reload={reload} visible={visible} setVisible={setVisible}
                    page={page} setShowFormView={setShowFormView} setTourStepsToolbars={setTourStepsToolbars} setTourOpen={setTourOpen}
                    showFormView={showFormView} setLoading={setLoading} />
                </Space>
                &nbsp;&nbsp;
                <Space>
                  {editable && <>
                    {habilitarBotonGuardar &&
                      <Button
                        ref={botonSave} type="primary" htmlType="submit" icon={<SaveOutlined />} onClick={handleOk}
                        disabled={saving}>
                        {!saving && i18next.t('common.actions.save.name')}
                        {saving && <>{i18next.t('common.actions.save.saving')} <Spin visible={saving}></Spin></>}
                      </Button>
                    }

                    <Button ref={botonExit} htmlType="button" icon={<CloseCircleTwoTone />} onClick={handleCancel}>
                      {i18next.t('common.actions.exit.name')}
                    </Button>

                  </>}
                </Space>
              </Row>
            </Form.Item>}

            {/*Si hay html se renderiza el html
              Si no hay html se renderiza el tabcomponent
              Cuando se clica la herramienta de edicion se renderiza el QgisTabComponent
            */}

            {/* Comprobar si la layer tiene  html definido en su capa de qgis*/}
            {
              (qgisLayer.mapTipTemplate || qgisLayer.mapTipTemplate !== "") && showFormView && feature &&
              <FormViewComponent page={page} qgisLayers={QGISPRJ.layers} map={map} qgisLayer={qgisLayer} feature={feature} mapView={mapView} QGISPRJ={QGISPRJ}></FormViewComponent>}

            {/* Formulario de edición */}

            {(!qgisLayer.mapTipTemplate || qgisLayer.mapTipTemplate === "" || !showFormView)
              &&
              <>
                <FormEditComponent QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} map={map} setFieldsChanged={setFieldsChanged}
                  form={form} editable={editable} feature={feature} properties={properties} mapView={mapView}
                  reload={reload}>
                </FormEditComponent>
                {isNew && qgisLayer && qgisLayer.customProperties && qgisLayer.customProperties.URBEGIS_MEDIA &&
                  <Space direction="vertical">
                    <h3>Archivos</h3>
                    <List
                      itemLayout="horizontal"
                      dataSource={files}
                      renderItem={(item, index) => (
                        <List.Item>
                          <div>{item.name}</div>
                          <Tooltip title="Eliminar archivo" placement="right">
                            <Button shape="circle" onClick={() => removeFile(index)} icon={<CloseOutlined />}></Button>
                          </Tooltip>
                        </List.Item>
                      )}
                    ></List>
                    {media && media.capabilities && media.capabilities.allowInsert &&
                      <Button type="primary"
                        disabled={false} onClick={(e) => insertFile()}>
                        <Space>
                          <FileAddOutlined />
                          {i18next.t('common.actions.media.insert')}
                        </Space>

                      </Button>}
                  </Space>
                }
                {viewInsert && <MediaFormComponentModalInput
                  item={null} qgisLayer={qgisLayer}
                  visible={viewInsert} setVisible={setViewInsert}
                  files={files} setFiles={setFiles}
                  filesControlState={null} setFilesControlState={null}></MediaFormComponentModalInput>}
              </>
            }
          </Form>
        </Card>

      }
      <Modal title={<div className="reader">{i18next.t('common.msg.pendingSave.title')}</div>}
        okText={<div className="reader">{i18next.t('common.actions.yes.name')}</div>}
        cancelText={<div className="reader">{i18next.t('common.actions.no.name')}</div>}
        open={showModalConfirmExit} onOk={handleOkAndExit} onCancel={handleConfirmCancel}>
        <p className="reader">{i18next.t('common.msg.pendingSave.content')} </p>
      </Modal>
      {/* TOUR CON LA AYUDA */}
      {tourOpen && <Tour open={tourOpen} arrow={false} onClose={() => setTourOpen(false)} steps={getTourSteps()} zIndex={2000} />}
    </>
  );
})

export default FormComponent;
