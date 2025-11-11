import { useState } from "react";
import ReactDOM from 'react-dom/client';
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import i18next from "i18next";
import NotificationComponent from "../../utils/NotificationComponent";
import { QgisService } from "../../../service/qgisService";
import { getWMSLayer } from "../../../utilities/mapUtils";
import { MediaService } from "../../../service/mediaService";

function ConfirmDeleteComponent({ map, feature, layer, qgisLayer, mapView, reload, setVisible, setModalOpen, setLoading }) {

  const [open, setOpen] = useState(true);

  const refreshWMSLayer = async () => {
    if (mapView && mapView.wmsLayer) {
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
    setLoading(true)
    QgisService.DELETEFEATURE(map, feature)
      .then((data) => {
        //Informamos de que se han borrado corréctamente los datos
        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        messages.render(
          <NotificationComponent type="success" text="delete"></NotificationComponent>
        );
        if (setModalOpen) {
          setModalOpen(false);
        }
        reload();
        refreshWMSLayer();

        return true
      }).then((featureDeleted) => {
        if (featureDeleted) {
          deleteFeatureMedia(map, feature)
        }
        setLoading(false)
      })
      .catch(err => {
        setLoading(false)
        console.log("ERROR", err);

      });

    setOpen(false);
    setVisible(false);
  }

  const deleteFeatureMedia = (map, feature) => {
    MediaService.DELETEFEATUREMEDIA(map, feature)
      .then(() => {
        //Informamos de que se han borrado corréctamente los datos
        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        messages.render(
          <NotificationComponent type="success" text="deleteMedia"></NotificationComponent>
        );
        //reload();
        //setViewDelete(false);
      })
      .catch(err => {
        console.log("ERROR", err);
      })
  }
  const handleCancel = () => {
    setOpen(false);
    setVisible(false);
  }

  return (
    <>
      <Modal
        title={(<><ExclamationCircleOutlined /> <div className="reader">{i18next.t('common.actions.delete.title', { layername: layer })}</div></>)}
        okText={<div className="reader">{i18next.t('common.actions.delete.name')}</div>}
        okButtonProps={{ disabled: false }}
        cancelText={<div className="reader">{i18next.t('common.actions.cancel.name')}</div>}
        cancelButtonProps={{ disabled: false }}
        maskClosable={false}
        icon={<ExclamationCircleOutlined />}
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}>
        <p className="reader">{i18next.t('common.actions.delete.confirmMsg')}</p>
      </Modal>
    </>
  );
}

export default ConfirmDeleteComponent;
