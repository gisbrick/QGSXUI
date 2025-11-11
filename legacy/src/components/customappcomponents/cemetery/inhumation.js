import { useState, useEffect } from "react";
import { Button, Form, Spin, Steps, theme } from "antd";
import ReactDOM from 'react-dom/client';
import i18next from "i18next";
import Title from "antd/es/typography/Title";
import { QgisService } from "../../../service/qgisService";
import { getLastPropertiesReusable } from "../../../utilities/mapUtils";

import PersonalDataInhu from "./inhumation/personalDataInhu";
import NotificationComponent from "../../utils/NotificationComponent";
import LoadingComponent from "../../utils/LoadingComponent";
import { MediaService } from "../../../service/mediaService";
import MultimediaInhu from "./inhumation/multimediaInhu";
import UnidadFunerariaInput from "./inhumation/unidadFunerariaInput";

const Inhumation = ({ map, custom_app_component, colorBackground }) => {

  const { token } = theme.useToken();

  const [current, setCurrent] = useState(0);
  const [QGISPRJ, setQGISPRJ] = useState();
  const [qgisLayer, setQgisLayer] = useState(null);
  const [qgisLayerWithUnitFune, setqgisLayerWithUnitFune] = useState(null)
  const [qgisLayerWithoutUnitFune, setqgisLayerWithoutUnitFune] = useState(null)
  const [steps, setSteps] = useState([])
  let [properties, setProperties] = useState({})

  const [loading, setLoading] = useState(false)
  const [tiposUnidadesFunerarias, setTiposUnidadesFunerarias] = useState([])
  const [tipoEstadoUnidadesFunerarias, setTipoEstadoUnidadesFunerarias] = useState([])
  const [tiposResto, setTiposResto] = useState([])
  const [zonas, setZonas] = useState([])
  const [files, setFiles] = useState([])

  const [form] = Form.useForm();
  const [saveEdit, setSaveDone] = useState(false)


  useEffect(() => {
    initData()
  }, [saveEdit])


  useEffect(() => {
    let stepsAux = []
    if (qgisLayer) {
      stepsAux.push({
        title: <div className="reader">{i18next.t("custom_app_component.cemetery.steps.data.label")}</div>,
        content:
          <div style={{ padding: "10px" }}>
            <PersonalDataInhu QGISPRJ={QGISPRJ} qgisLayer={qgisLayerWithUnitFune} map={map} feature={null}
              editable={true} mapView={null} properties={properties} setProperties={setProperties} form={form}
            ></PersonalDataInhu>
          </div>
      })

      stepsAux.push({
        title: <div className="reader">{i18next.t("custom_app_component.cemetery.steps.unit.label")}</div>,
        content:
          <div style={{ padding: "10px" }}>
            {<UnidadFunerariaInput QGISPRJ={QGISPRJ} qgisLayer={qgisLayerWithoutUnitFune} map={map} feature={false}
              editable={true} mapView={null} properties={properties} setProperties={setProperties} form={form}
              tiposUnidadesFunerarias={tiposUnidadesFunerarias} estadosUnidadesFunerarias={tipoEstadoUnidadesFunerarias}
              tiposResto={tiposResto} zonas={zonas} colorBackground={colorBackground}></UnidadFunerariaInput>}
          </div>
      })

      stepsAux.push({
        title: <div className="reader">{i18next.t("custom_app_component.cemetery.steps.media.label")}</div>,
        content:
          <div style={{ padding: "10px" }}>
            <MultimediaInhu qgisLayer={qgisLayer} files={files} setFiles={setFiles}
            ></MultimediaInhu>
          </div>
      })

    }

    setSteps(stepsAux)
  }, [qgisLayer])

  const getTiposUnidadesFunerarias = async (map, layerName) => {
    return await QgisService.GETFEATURES(map, layerName, null, null, null, null, null, null)
  }

  const getTipoEstadosUnidad = async (map, layerName) => {
    return await QgisService.GETFEATURES(map, layerName, null, null, null, null, null, null)
  }

  const getTiposResto = async (map, layerName) => {
    return await QgisService.GETFEATURES(map, layerName, null, null, null, null, null, null)
  }

  const getQGISPRJ = async (map) => {
    return await QgisService.QGISPRJ(map)
  }

  const getZonasCementerio = async (map, layerName) => {
    return await QgisService.GETFEATURES(map, layerName, null, null, null, null, null, null)
  }

  const initData = () => {
    setLoading(true)

    Promise.all([getQGISPRJ(map), getTiposUnidadesFunerarias(map, "Tipo unidad funeraria"), getTipoEstadosUnidad(map, "Estado unidad funeraria"),
    getTiposResto(map, "Tipo de resto"), getZonasCementerio(map, "Zonas")])
      .then((values) => {
        setQGISPRJ(values[0]);
        setQgisLayer(values[0].layers["Inhumados"])
        setqgisLayerWithUnitFune(filtrarQgisLayer(structuredClone(values[0].layers["Inhumados"]), "cod_unid_f", true))
        setqgisLayerWithoutUnitFune(filtrarQgisLayer(structuredClone(values[0].layers["Inhumados"]), "cod_unid_f", false))

        if (values[1].features.length > 0) {
          setTiposUnidadesFunerarias(values[1].features)
        }
        if (values[2].features.length > 0) {
          setTipoEstadoUnidadesFunerarias(values[2].features)
        }
        if (values[3].features.length > 0) {
          setTiposResto(values[3].features)
        }
        if (values[4].features.length > 0) {
          setZonas(renderSelect(values[4].features))
        }
        setLoading(false)
      })
      .catch((error) => {
        console.log("error", error)
        setLoading(false)
      })
  }

  const renderSelect = (zonas) => {
    let zonasProps = []
    for (let i in zonas) {
      zonasProps.push({
        key: zonas[i].properties.id_zona,
        value: zonas[i].properties.id_zona,
        label: zonas[i].properties.name
      })
    }
    return zonasProps
  }

  const filtrarQgisLayer = (qgisLayer, field, out) => {
    let qgisLayerAux = qgisLayer;
    let finalTabs = [...qgisLayer.editFormConfig.tabs.filter((tab) => tab.name == field)]
    if (out) {
      finalTabs = [...qgisLayer.editFormConfig.tabs.filter((tab) => tab.name != field)]
    }
    qgisLayerAux.editFormConfig.tabs = finalTabs
    return qgisLayerAux
  }

  const next = () => {
    form.validateFields().then((value) => {
      setCurrent(current + 1);
    }).catch((err) => {
      let errors = []
      for (let i in err.errorFields) {
        for (let n in err.errorFields[i].errors) {
          errors.push(err.errorFields[i].errors[n])
        }
      }
    })
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const items = steps.map((item) => ({
    key: item.title,
    title: item.title,
  }));

  const contentStyle = {
    lineHeight: '260px',
    textAlign: 'center',
    color: token.colorTextTertiary,
    backgroundColor: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    border: `1px dashed ${token.colorBorder}`,
    marginTop: 16,
  };

  const save = () => {
    //console.log("guardar", properties)
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
    let d = new Date()
    openNotification(d)
    let feature = null;
    let geometry = null;

    QgisService.UPDATEFEATURE(map, qgisLayer, feature, properties, geometry)
      .then((data) => {
        //Guardamos en la layer las propiedades de la última inserción, 
        //para poder emplearlas en aquellos campos que queranos documentar automáticamente en base al último valo
        qgisLayer.lastInsertProperties = getLastPropertiesReusable(qgisLayer, properties);

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
        setProperties({})

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
              closeNotification(d)
              reset()
              setSaveDone(!saveEdit)
              //console.log("guardado correcto de media")
            })
            .catch(err => {
              console.log("ERROR", err);
              closeNotification(d)
            })
        } else {
          closeNotification(d)
          reset()
          setSaveDone(!saveEdit)
        }
      })
      .catch(err => {
        console.log("ERROR", err);
        //Informamos dde que algunos valores no son válidos      
        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        messages.render(
          <NotificationComponent type="error" text="transaction" description={err.join('; ')}></NotificationComponent>
        );
        closeNotification(d)
      });

  }

  const openNotification = (d) => {
    let descriptionStart = i18next.t('custom_app_component.cemetery.msg.descriptionStart', { type: i18next.t("custom_app_component.cemetery.inhumation.label"), time: d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0') + ":" + d.getSeconds().toString().padStart(2, '0') })
    window.api["info"]({
      message: i18next.t("custom_app_component.cemetery.msg.processing"),
      description: <>{descriptionStart}<br />{i18next.t('common.actions.download.wait')}  <Spin></Spin></>,
      key: d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0') + ":" + d.getSeconds().toString().padStart(2, '0'),
      duration: 0
    });
  };

  const closeNotification = (d) => {
    window.api.destroy(d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0') + ":" + d.getSeconds().toString().padStart(2, '0'))
  }

  const reset = () => {
    setProperties({})
    setCurrent(0)
    form.setFieldsValue({});
    form.resetFields()
    setFiles([])
    setQGISPRJ(null);
    setQgisLayer(null)
    setqgisLayerWithUnitFune(null)
    setqgisLayerWithoutUnitFune(null)
    initData()
  }


  const render = () => {
    return <>
      <Title level={3} className="reader" style={{ marginBottom: "0" }}>{i18next.t("custom_app_component.cemetery.inhumation.header")}</Title>
      <br />
      <Steps current={current} items={items} />
      <div style={contentStyle}>{steps[current].content}</div>
      <div
        style={{
          margin: 10,
          textAlign: "center"
        }}
      >
        {current > 0 && (
          <Button
            style={{
              margin: '0 8px',
            }}
            type="primary"
            onClick={() => prev()}
          >
            {i18next.t("custom_app_component.cemetery.actions.previous")}
          </Button>
        )}
        {current < steps.length - 1 && (
          <Button
            style={{
              margin: '0 8px',
            }}
            type="primary" onClick={() => next()}>
            {i18next.t("custom_app_component.cemetery.actions.next")}
          </Button>
        )}
        {current === steps.length - 1 && (
          <Button
            style={{
              margin: '0 8px',
            }}
            type="primary" onClick={() => {
              save()
            }}>
            {i18next.t("custom_app_component.cemetery.actions.done")}
          </Button>
        )}
        {
          <Button
          style={{
            margin: '0 8px',
          }}
          type="primary" onClick={() => {
            //save()
            reset()
          }}>
            {i18next.t("custom_app_component.cemetery.actions.cancel")}
          </Button>
        }

      </div>
    </>
  }

  return (
    <>
      {steps.length > 0 && QGISPRJ && qgisLayer && tiposUnidadesFunerarias.length > 0 &&
        qgisLayerWithUnitFune && qgisLayerWithoutUnitFune && tiposResto.length > 0 && zonas.length > 0 && render()}
      {loading && <LoadingComponent></LoadingComponent>}
    </>
  )
};
export default Inhumation;