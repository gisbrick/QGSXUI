import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import ReactDOM from 'react-dom/client';
import { Button, Card, DatePicker, Form, Input, Modal, Row, Space, Spin, Upload } from "antd"
import dayjs from 'dayjs';
import i18next from "i18next";
import { CloseCircleTwoTone, DownloadOutlined, PlusOutlined, SaveOutlined, UploadOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import NotificationComponent from "../utils/NotificationComponent";
import { MediaService } from "../../service/mediaService";


const MediaFormComponent = forwardRef(({ map, editable: editableAux, item, media, feature, qgisLayer, reload, visible, setVisible }, ref) => {
  const [form] = Form.useForm();
  const [fieldsChanged, setFieldsChanged] = useState(false);
  const [showModalConfirmExit, setShowModalConfirmExit] = useState(false);
  const [editable, setEditable] = useState();

  const [selectedFile, setSelectedFile] = useState();
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState();

  //Hacemos una copia de las propiedades
  let propsAux = item ? { ...item } : {};

  let [properties, setProperties] = useState();



  const reloadForm = () => {
    //Si es un nbuevo elemento (insert), habilitamos desde el primer momento el botón de guardar
    if (!item) {
      setFieldsChanged(true)
      item = {}
      item["datepublish"] = new Date();
    }
    else {
      setIsNew(false)
    }

    let propsAux = item ? { ...item } : {};
    setProperties(propsAux)
    setEditable(editableAux)


    form.setFieldsValue(propsAux);
  }

  useEffect(() => {
    reloadForm();
  }, [])

  const create = (reload, properties, map, feature, mediaService) => {
    let props = {};
    props["name"] = properties["name"] && properties["name"] != "undefined" ? properties["name"] : ""
    props["description"] = properties["description"] && properties["description"] != "undefined" ? properties["description"] : ""

    if (properties["datepublish"]) {
      if (typeof properties["datepublish"] === 'string' || properties["datepublish"] instanceof String) {
        props["datepublish"] = dayjs(properties["datepublish"]).toDate()
      }
      else if (properties["datepublish"] instanceof Date) {
        props["datepublish"] = properties["datepublish"];
      }
      else {
        props["datepublish"] = properties["datepublish"].toDate()
      }
    }

    if (selectedFile && selectedFile != undefined) {
      props["file"] = selectedFile;
    }
    setSaving(true);
    mediaService.CREATE(map, feature, props)
      .then((data) => {
        setSaving(false);
        //Informamos de que se han actualizado corréctamente los datos
        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        messages.render(
          <NotificationComponent type="success" text="save"></NotificationComponent>
        );

        reload();
        setVisible(false);
      }).catch(err => {
        console.log("ERROR", err);
        setSaving(false);
      });
  }


  const update = (reload, properties, map, feature, mediaService, exit) => {
    let props = {};
    props["name"] = properties["name"] && properties["name"] != "undefined" ? properties["name"] : ""
    props["description"] = properties["description"] && properties["description"] != "undefined" ? properties["description"] : ""

    if (properties["datepublish"]) {
      if (typeof properties["datepublish"] === 'string' || properties["datepublish"] instanceof String) {
        props["datepublish"] = dayjs(properties["datepublish"]).toDate()
      }
      else if (properties["datepublish"] instanceof Date) {
        props["datepublish"] = properties["datepublish"];
      }
      else {
        props["datepublish"] = properties["datepublish"].toDate()
      }

    }

    if (selectedFile && selectedFile != undefined) {
      props["file"] = selectedFile;
    }
    //props["file"] = !selectedFile || selectedFile == undefined ? [null] : [selectedFile];
    setSaving(true);
    mediaService.UPDATE(map, feature, props, item.uidMedRsc)
      .then((data) => {
        setSaving(false);
        //Informamos de que se han actualizado corréctamente los datos
        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        messages.render(
          <NotificationComponent type="success" text="update"></NotificationComponent>
        );
        setFieldsChanged(false)

        reload();
        if (exit) {
          setVisible(false);
        }
      }).catch(err => {
        console.log("ERROR", err);
        setSaving(false);
      });
  }

  const handleOk = () => {
    form.validateFields().then((value) => {
      if (isNew) {
        create(reload, properties, map, feature, MediaService);
      }
      else {
        update(reload, properties, map, feature, MediaService, false)
      }

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

  const handleOkAndExit = () => {
    form.validateFields().then((value) => {
      if (isNew) {
        create(reload, properties, map, feature, MediaService);
      }
      else {
        update(reload, properties, map, feature, MediaService, true)
      }
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

  const handleCancel = () => {
    if (fieldsChanged) {
      setShowModalConfirmExit(true);
    }
    else {
      handleConfirmCancel();
    }
  }

  const handleConfirmCancel = () => {
    if (setVisible) setVisible(false);
  }

  useImperativeHandle(ref, () => ({
    imperativeHandleCancel() {
      handleCancel();
    }
  }), [handleCancel]);


  const dummyUploadRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  const uploadProps = {
    multiple: false,
    customRequest: dummyUploadRequest,
    onRemove: (file) => {
      setSelectedFile(null);
    },
    onChange: (info) => {

    },
    beforeUpload: (file) => {
      setSelectedFile(file);
      setFieldsChanged(true);
      return true;


    },
    fileList: selectedFile ? [selectedFile] : []
  };


  //Reseteamos todos los tabs prinicpales del form para que se vuelvan a pintar
  if (qgisLayer) qgisLayer.editFormConfig.tabs.map((tab) => {
    if (tab.isRendered) tab.isRendered = false;
  });

  const getDateValue = (value) => {
    if (value != null) {
      return dayjs(value)
    }
    else {
      return null;
    }
  }

  const getFileRules = (value) => {
    if (isNew) {
      return [
        {
          required: true, message: i18next.t('common.msg.form.requiredField', { 'fieldName': i18next.t('common.actions.media.file') }),
          validator: (rule, value, cb) => {
            let valid = selectedFile != null;
            if (valid) {
              return Promise.resolve();
            }
            else {
              return Promise.reject(new Error(i18next.t('common.msg.form.requiredField', { 'fieldName': i18next.t('common.actions.media.file') })));
            }
          }
        }
      ]
    }
    else {
      return []
    }
  }

  return (
    <>
      {properties &&
        <Card
          size="small"
          bordered={true}
          style={{}}>
          <Form
            layout={"vertical"}
            disabled={false} // De momento lo pongo siempre como editable... ya veremos como lo dejamos
            onFieldsChange={(field, allFields) => {
              //Actualizamos el valor, para que no haya que cambiar el foco del input para que se actualice
              if (field.length > 0) properties[field[0].name[0]] = field[0].value;
              setProperties(properties)
              setFieldsChanged(true);
            }}
            form={form}>

            {<Form.Item style={{ marginleft: 'auto' }}>
              <Row justify={"end"}>
                <Space>
                  {fieldsChanged &&
                    <Button type="primary" htmlType="submit" onClick={handleOk} disabled={saving}>
                      <Space>
                        <SaveOutlined />
                        {/*!saving?i18next.t('common.actions.save.name'):saving && i18next.t('common.actions.save.saving')*/}
                        {!saving && i18next.t('common.actions.save.name')}
                        {saving && <>{i18next.t('common.actions.save.saving')} <Spin visible={saving}></Spin></>}
                      </Space>

                    </Button>
                  }

                  <Button htmlType="button" onClick={handleCancel}>
                    <Space>
                      <CloseCircleTwoTone />
                      {i18next.t('common.actions.exit.name')}
                    </Space>

                  </Button>
                </Space>
              </Row>
            </Form.Item>}

            <Form.Item label={i18next.t('common.actions.media.name_')} name={"name"}
              rules={[
                { required: true, message: i18next.t('common.msg.form.requiredField', { 'fieldName': i18next.t('common.actions.media.name_') }) }
              ]}>
              <Input />
            </Form.Item>

            <Form.Item label={i18next.t('common.actions.media.description')} name={"description"}>
              <TextArea rows={4} />
            </Form.Item>


            <Form.Item label={i18next.t('common.actions.media.date')} name={"datepublish"}
              defaultValue={("datepublish" in properties ? getDateValue(properties["datepublish"]) : dayjs())} getValueProps={(i) => ({ value: getDateValue(i) })}
              rules={[
                { required: true, message: i18next.t('common.msg.form.requiredField', { 'fieldName': i18next.t('common.actions.media.date') }) }
              ]}>
              <DatePicker format={'DD/MM/YYYY'} />
            </Form.Item>

            <Form.Item label={i18next.t('common.actions.media.file')} name={"file"} rules={
              getFileRules()
            }>

              <Upload {...uploadProps}>
                <Button>
                  <Space>
                    <UploadOutlined />
                    {i18next.t('common.actions.media.selectFile')}
                  </Space>
                </Button>
              </Upload>
            </Form.Item>
          </Form>
        </Card>
      }
      <Modal title={i18next.t('common.msg.pendingSave.title')}
        okText={i18next.t('common.actions.yes.name')} okButtonProps={{ disabled: false }}
        cancelText={i18next.t('common.actions.no.name')} cancelButtonProps={{ disabled: false }}
        open={showModalConfirmExit} onOk={handleOkAndExit} onCancel={handleConfirmCancel}>
        <p>{i18next.t('common.msg.pendingSave.content')} </p>
      </Modal>
    </>
  );
})

export default MediaFormComponent;
