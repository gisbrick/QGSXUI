import { Button, Spin, notification } from 'antd';
import i18next from "i18next";
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import NotificationComponent from './NotificationComponent';
import { CommonService } from '../../service/common/commonService';

const PostDownloadComponent = ({ url, data, type, starttime, format, setDownloading }) => {
    //const [api, contextHolder] = notification.useNotification();

    useEffect(() => {
        openNotificationDownloading()

    }, [])


    const getDownload = (createObjectURL) => {
        return <a href={createObjectURL} target="_blank">{i18next.t('common.actions.download.download')}</a>
    }



    const openNotificationDownloading = async () => {
        //if (setDownloading) setDownloading(true)
        let descriptionStart = i18next.t('common.actions.download.descriptionStart', { type: type, time: starttime })
        window.api["info"]({
            message: i18next.t('common.actions.download.processing'),
            description: <>{descriptionStart}<br />{i18next.t('common.actions.download.wait')}  <Spin></Spin></>,
            key: starttime,
            duration: 0
        });


        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
        fetch(url, requestOptions).then((response) => {           
            if (response.ok) {
                return response.blob();
            }
        }).then((blob) => {
            if (setDownloading) setDownloading(false)
            // Do something with the response           
            const createObjectURL = window.URL.createObjectURL(
                blob
            );
            window.api.destroy(starttime)
            openNotificationDownload(createObjectURL)
        }).catch((error) => {
            //Informamos dde que algunos valores no son válidos      
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
                <NotificationComponent type="error" text="download_report_error"></NotificationComponent>
            );

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
export default PostDownloadComponent;