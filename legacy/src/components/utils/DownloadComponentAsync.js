import { Button, Spin, notification } from 'antd';
import i18next from "i18next";
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import NotificationComponent from './NotificationComponent';

const DownloadComponentAsync = ({ urlInit, urlStatus, urlFile, type, starttime, format }) => {
    //const [api, contextHolder] = notification.useNotification();

    useEffect(() => {
        openNotificationDownloading()

    }, [])


    const getDownload = (createObjectURL) => {
        return <a href={createObjectURL} target="_blank">{i18next.t('common.actions.download.download')}</a>
    }

    const downloadFile = async (starttime, filename) => {
        urlFile = urlFile.replace("{FILENAME}", filename)
        fetch(urlFile, {
            method: 'GET'
        }).then((response) => response.blob()).then((blob) => {
            // Create blob link to download
            const createObjectURL = window.URL.createObjectURL(
                blob
            );
            window.api.destroy(starttime)
            openNotificationDownload(createObjectURL)
        });
    }
    const checkStatus = async (starttime, filename, i) => {
        urlStatus = urlStatus.replace("{FILENAME}", filename)

        window.api.destroy(starttime)
        openNotificationGeneratingReport()

        fetch(urlStatus, {
            method: 'GET'
        }).then((response) => {
            response.json().then(obj => {
                if (i < 100) {
                    if (obj.status == "finished") {
                        downloadFile(starttime, filename)
                    }
                    else {
                        //TODO ver si ponemos un límite de tiempo om intentos de evaluación de status para evaluar la exportación
                        setTimeout(checkStatus(starttime, filename, ++i), 3000)
                    }
                }
                else {
                    window.api.destroy(starttime)
                    alert("Superado el tiempo de espera máximo. TODO integrar este mensaje en API.")
                }
            })

        });
    }

    const openNotificationDownloading = async () => {
        let descriptionStart = i18next.t('common.actions.download.descriptionStart', { type: type, time: starttime })
        window.api["info"]({
            message: i18next.t('common.actions.download.preprocessing'),
            description: <>{descriptionStart}<br />{i18next.t('common.actions.download.wait')}  <Spin></Spin></>,
            key: starttime,
            duration: 0
        });


        fetch(urlInit, {
            method: 'GET'
        }).then((response) => {
            response.json().then(obj => {
                console.log("Aaaaa", obj)
                checkStatus(starttime, obj.file, 0)
            })
        });

        /*.catch(err => {
      alert("TODO INFORMAR DE ERROR GENERANDO FICHERO")
      }) */
    };

    const openNotificationGeneratingReport = () => {

        let descriptionStart = i18next.t('common.actions.download.descriptionStart', { type: type, time: starttime })
        window.api["info"]({
            message: i18next.t('common.actions.download.processing'),
            description: <>{descriptionStart}<br />{i18next.t('common.actions.download.wait')}  <Spin></Spin></>,
            key: starttime,
            duration: 0
        });
    };

    const openNotificationDownload = (createObjectURL) => {
        let descriptionStart = i18next.t('common.actions.download.descriptionStart', { type: type, time: starttime })
        let d = new Date()
        let endtime = d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0') + ":" + d.getSeconds().toString().padStart(2, '0')
        let descriptionEnd = i18next.t('common.actions.download.descriptionEnd', { type: type, time: endtime })
        window.api["success"]({
            message: <>{i18next.t('common.actions.download.downloaded')}</>,
            description: <>{descriptionStart}<br />{descriptionEnd}<br />{getDownload(createObjectURL)}</>,
            duration: 0
        });
    };


    return (
        <>
            {/*contextHolder*/}
        </>
    )
};
export default DownloadComponentAsync;