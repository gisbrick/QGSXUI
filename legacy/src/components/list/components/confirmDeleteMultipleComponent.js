import { useState } from "react";
import ReactDOM from 'react-dom/client';
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import i18next from "i18next";
import NotificationComponent from "../../utils/NotificationComponent";
import { QgisService } from "../../../service/qgisService";
import { getWMSLayer } from "../../../utilities/mapUtils";
import { MediaService } from "../../../service/mediaService";

function ConfirmDeleteMultipleComponent({ map, selection, layer, tableActions, qgisLayer, mapView, reload, setVisible, setModalOpen, setLoading }) {

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
    QgisService.DELETEFEATURES(map, selection)
      .then((data) => {
        //Informamos de que se han borrado corréctamente los datos
        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        messages.render(
          <NotificationComponent type="success" text="delete_multiple"></NotificationComponent>
        );
        if (setModalOpen) setModalOpen(false);
        tableActions.clearSelection()
        reload();
        refreshWMSLayer();
        return true
      })
      .then((featuresDeleted) => {
        if (featuresDeleted) {
          let arrayPromises = []
          selection.forEach(element => {
            arrayPromises.push(deleteFeaturesMedia(map, {"id":element}))
          });
          Promise.all(arrayPromises)
            .then(() => {
              setLoading(false)
              //Informamos de que se han borrado corréctamente los datos
              const messages = ReactDOM.createRoot(document.getElementById('messages'));
              messages.render(
                <NotificationComponent type="success" text="deleteMedia"></NotificationComponent>
              );
            })
            .catch((error) => {
              console.log("error al eliminar la media de features", error)
            })
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

  const handleCancel = () => {
    setOpen(false);
    setVisible(false);
  }

  const deleteFeaturesMedia = async (map, feature) => {
    await MediaService.DELETEFEATUREMEDIA(map, feature)
  }

  return (
    <>
      <Modal
        title={(<><ExclamationCircleOutlined /> <div className="reader">{i18next.t('common.actions.deleteMultiple.title', { layername: layer })}</div></>)}
        okText={<div className="reader">{i18next.t('common.actions.deleteMultiple.name')}</div>}
        okButtonProps={{ disabled: false }}
        cancelText={<div className="reader">{i18next.t('common.actions.cancel.name')}</div>}
        cancelButtonProps={{ disabled: false }}
        maskClosable={false}
        icon={<ExclamationCircleOutlined />}
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}>
        <p className="reader">{i18next.t('common.actions.deleteMultiple.confirmMsg')}</p>
      </Modal>
    </>
  );
}

export default ConfirmDeleteMultipleComponent;
