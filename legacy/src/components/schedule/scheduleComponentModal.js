import { useState, useRef } from "react";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import i18next from "i18next";
import ScheduleComponent from "./scheduleComponent";



function ScheduleComponentModal({ schedule, map, editable, feature, QGISPRJ, qgisLayer, mapView, reload, visible, setVisible }) {
   
  const formRef = useRef(null);

  const [open, setOpen] = useState(true);

  const isNewFeature = feature == null || feature == undefined;

  const handleCancel = () => {
    if (formRef.current) {
      formRef.current.imperativeHandleCancel()
    }
    setVisible(false);

  }

  const getTitle = () => {
    return <div className="reader">{i18next.t('common.actions.schedule.title.feature', { layername: qgisLayer.name })}</div>
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
        width={1000}
        onCancel={handleCancel}>

        <ScheduleComponent ref={formRef} schedule={schedule} map={map} editable={editable} feature={feature} QGISPRJ={QGISPRJ} layer={qgisLayer.name} qgisLayer={qgisLayer} mapView={mapView} reload={reload} visible={visible} setVisible={setVisibleAux} >
        </ScheduleComponent>
      </Modal>
    }
    else {
      return <Modal
        title={(<>{getTitle()}</>)}
        maskClosable={false}
        open={open}
        footer={null}
        width={1000}
        onCancel={handleCancel}>

        <ScheduleComponent ref={formRef} schedule={schedule} map={map} editable={editable} feature={feature}  QGISPRJ={QGISPRJ} layer={qgisLayer.name} qgisLayer={qgisLayer} mapView={mapView} reload={reload} visible={visible} setVisible={setVisibleAux} >
        </ScheduleComponent>

      </Modal>
    }
  }

  return (
    <>
      {render()}
    </>
  );
}

export default ScheduleComponentModal;
