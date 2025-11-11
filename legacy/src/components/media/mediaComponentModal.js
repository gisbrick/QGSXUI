import { useState, useRef } from "react";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Modal, Button } from "antd";
import i18next from "i18next";
import MediaComponent from "./mediaComponent";


function MediaComponentModal({ media, map, editable, feature, qgisLayer, mapView, reload, visible, setVisible }) {

  const formRef = useRef(null);

  const [open, setOpen] = useState(true);

  const isNewFeature = feature == null || feature == undefined;

  const handleCancel = () => {
    if (formRef.current) {
      formRef.current.imperativeHandleCancel()
    } else {
      setVisible(false);
    }
    

  }

  const getTitle = () => {
    return i18next.t('common.actions.media.title.feature', { layername: qgisLayer.name })
  }

  const setVisibleAux = (value) => {
    setVisible(value);
  }


  const render = () => {

    if (editable) {
      return <Modal
        title={(<>{getTitle()}</>)}
        maskClosable={false}
        open={open}
        footer={null}
        onCancel={handleCancel}>

        <MediaComponent ref={formRef} media={media} map={map} editable={editable} feature={feature} layer={qgisLayer.name} qgisLayer={qgisLayer} mapView={mapView} reload={reload} visible={visible} setVisible={setVisibleAux} >
        </MediaComponent>
        <div style={{ textAlign: "center" }} >
          <Button disabled={false} type="primary" onClick={() => handleCancel()}>
            {i18next.t("common.actions.exit.name")}
            </Button>
        </div>
      </Modal>
    }
    else {
      return <Modal
        title={(<>{getTitle()}</>)}
        maskClosable={false}
        open={open}
        footer={null}
        onCancel={handleCancel}>

        <MediaComponent ref={formRef} media={media} map={map} editable={editable} feature={feature} layer={qgisLayer.name} qgisLayer={qgisLayer} mapView={mapView} reload={reload} visible={visible} setVisible={setVisibleAux} >
        </MediaComponent>
        <div style={{ textAlign: "center" }} >
          <Button disabled={false} type="primary" onClick={() => handleCancel()}>
          {i18next.t("common.actions.exit.name")}
            </Button>
        </div>
      </Modal>
    }
  }

  return (
    <>
      {render()}
    </>
  );
}

export default MediaComponentModal;
