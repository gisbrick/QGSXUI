import { useState, useRef } from "react";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import i18next from "i18next";
import MediaFormComponent from "./mediaFormComponent";


function MediaFormComponentModal({ map, editable, item, media, setEditable, feature, qgisLayer, reload, visible, setVisible }) {

  const formRef = useRef(null);


  const handleCancel = () => {
    if (formRef.current) {
      formRef.current.imperativeHandleCancel()
    }
    setVisible(false);

  }

  const getTitle = () => {
    if(item){
      return i18next.t('common.actions.media.edit', { layername: qgisLayer.name })
    }
    else{
      return i18next.t('common.actions.media.insert', { layername: qgisLayer.name })
    }    
  }



  const render = () => {
    return <Modal
      title={(<>{getTitle()}</>)}
      maskClosable={false}
      open={visible}
      footer={null}
      onCancel={handleCancel}>

      <MediaFormComponent ref={formRef} map={map} editable={editable} item={item} media={media}
        feature={feature} qgisLayer={qgisLayer} reload={reload} visible={visible} setVisible={setVisible}>
      </MediaFormComponent>
    </Modal>
  }

  return (
    <>
      {render()}
    </>
  );
}

export default MediaFormComponentModal;
