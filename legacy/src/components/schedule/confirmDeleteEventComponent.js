import { useState } from "react";
import ReactDOM from 'react-dom/client';
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import i18next from "i18next";
import NotificationComponent from "../utils/NotificationComponent";
import { QgisScheduleService } from "../../service/qgisScheduleService";

/*
import NotificationComponent from "../../utils/NotificationComponent";
import { QgisScheduleService } from "../../../service/QgisScheduleService";
import { getWMSLayer } from "../../../utilities/mapUtils";
*/

function ConfirmDeleteEventComponent({map, feature, layer, qgisLayer, mapView, reload, setVisible, setModalOpen}) {
  //console.log("feature", feature)
  const [open, setOpen] = useState(true);

  const handleOk = () => {

    QgisScheduleService.DELETEFEATURE(map, feature)
      .then((data) => {
        //Informamos de que se han borrado corréctamente los datos
        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        messages.render(
          <NotificationComponent type="success" text="delete"></NotificationComponent>
        );
        if(setModalOpen)setModalOpen(false);
        reload();
      })
      .catch(err => {
        console.log("ERROR", err);
      });

  setOpen(false);
  setVisible(false);
}
const handleCancel = () => {
  setOpen(false);
  setVisible(false);
}

return (
  <>
    <Modal     
      title={(<><ExclamationCircleOutlined /> {i18next.t('common.actions.delete.title', { layername: layer })}</>)}
      okText={i18next.t('common.actions.delete.name')}
      okButtonProps={{disabled: false}}
      cancelText={i18next.t('common.actions.cancel.name')}
      cancelButtonProps={{disabled: false}}
      maskClosable={false}
      icon={<ExclamationCircleOutlined />}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}>
      <p>{i18next.t('common.actions.delete.confirmMsg')}</p>
    </Modal>
  </>
);
}

export default ConfirmDeleteEventComponent;
