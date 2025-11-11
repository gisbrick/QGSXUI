import { useState } from "react";
import { Button, Modal, Space, Tooltip } from "antd";
import ReactDOM from 'react-dom/client';
import {
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined, EnvironmentOutlined, ExclamationCircleOutlined, FileSearchOutlined, ZoomInOutlined
} from '@ant-design/icons';
import i18next from "i18next";
import { MediaService } from "../../service/mediaService";
import NotificationComponent from "../utils/NotificationComponent";
import MediaFormComponentModal from "./mediaFormComponentModal";



function MediaToolbarComponent({ map, media, item, data, editable, setEditable, feature, qgisLayer, mapView, reload, visible, setVisible }) {

    const [viewDelete, setViewDelete] = useState();
    const [viewEdit, setViewEdit] = useState();

    let downloadFile = () => {
        MediaService.DOWNLOAD(map, feature, item.uidMedRsc);
    }
    let deleteFile = () => {
        MediaService.DELETE(map, feature, item.uidMedRsc)
            .then(() => {
                //Informamos de que se han borrado corréctamente los datos
                const messages = ReactDOM.createRoot(document.getElementById('messages'));
                messages.render(
                    <NotificationComponent type="success" text="delete"></NotificationComponent>
                );
                reload();
                setViewDelete(false);
            })
            .catch(err => {
                console.log("ERROR", err);
            })
    }
    let updateFile = () => {
        setViewEdit(true);
    }

    return (
        <>
            <>
                <Space wrap>
                    {/* BOTON DESCARGAR*/}
                    {item && media.capabilities && media.capabilities.allowQuery &&
                        <Tooltip title={i18next.t('common.actions.media.download')} key={"media.download"}>
                            <Button size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                                onClick={(e) => {
                                    downloadFile();
                                    window.mouseOverButton = false
                                }}
                                type={"default"} shape="circle">
                                <DownloadOutlined />
                            </Button>
                        </Tooltip>
                    }
                    {/* BOTON EDITAR*/}
                    {item && media.capabilities && media.capabilities.allowUpdate &&
                        <Tooltip title={i18next.t('common.actions.media.edit')} key={"media.edit"}>
                            <Button size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                                onClick={(e) => {
                                    updateFile();
                                    window.mouseOverButton = false
                                }}
                                type={"default"} shape="circle">
                                <EditOutlined />
                            </Button>
                        </Tooltip>
                    }
                    {/* BOTON BORRAR*/}
                    {item && media.capabilities && media.capabilities.allowDelete &&
                        <Tooltip title={i18next.t('common.actions.media.delete')} key={"media.delete"}>
                            <Button size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                                onClick={(e) => {
                                    setViewDelete(true);
                                    window.mouseOverButton = false
                                }}
                                type={"default"} shape="circle">
                                <DeleteOutlined />
                            </Button>
                        </Tooltip>
                    }
                </Space>

                {viewDelete && <Modal
                    title={(<><ExclamationCircleOutlined /> {i18next.t('common.actions.media.delete')}</>)}
                    okText={i18next.t('common.actions.delete.name')}
                    okButtonProps={{ disabled: false }}
                    cancelText={i18next.t('common.actions.cancel.name')}
                    cancelButtonProps={{ disabled: false }}
                    maskClosable={false}
                    icon={<ExclamationCircleOutlined />}
                    open={viewDelete}
                    onOk={deleteFile}
                    onCancel={(e) => setViewDelete(false)}>
                    <p >{i18next.t('common.actions.delete.confirmMsg')}</p>
                </Modal>}

                {viewEdit && <MediaFormComponentModal map={map} editable={editable} item={item} media={media}
          feature={feature} qgisLayer={qgisLayer} reload={reload} visible={viewEdit} setVisible={setViewEdit}></MediaFormComponentModal>}


            </>
        </>
    );
}

export default MediaToolbarComponent;