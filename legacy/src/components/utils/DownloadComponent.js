import { Button, Spin, notification } from 'antd';
import i18next from "i18next";
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import NotificationComponent from './NotificationComponent';

const DownloadComponent = ({ url, type, starttime, format, setDownloading }) => {
    //const [api, contextHolder] = notification.useNotification();

    useEffect(() => {
        openNotificationDownloading()

    }, [])


    const getDownload = (createObjectURL) => {
        return <a href={createObjectURL} target="_blank">{i18next.t('common.actions.download.download')}</a>
    }

    const openNotificationDownloadingReport = async () => {
        //En primer lugar recuperamos la URL del endpoint de qgis serve (para no bloquear la app JAVA)
        fetch(url).then((response) => {
            if (response.ok) {
                return response.text();
            }
        }).then((url) => {
            //Una vez recuperada la URL, hacemos la request diréctamente
            fetch(url).then((response) => {
                if (response.ok) {
                    return response.blob();
                }
            }).then((blob) => {
                if (setDownloading) setDownloading(false)
                // Do something with the response
                console.log(blob)            // Create blob link to download
                const createObjectURL = window.URL.createObjectURL(
                    blob
                );
                window.api.destroy(starttime)
                openNotificationDownload(createObjectURL)
            }).catch((error) => {

                //Segundo intento
                fetch(url).then((response) => {
                    if (response.ok) {
                        return response.blob();
                    }
                    //Informamos dde que algunos valores no son válidos      
                    const messages = ReactDOM.createRoot(document.getElementById('messages'));
                    messages.render(
                        <NotificationComponent type="error" text="download_report_error"></NotificationComponent>
                    );
                }).then((blob) => {
                    // Do something with the response
                    console.log(blob)            // Create blob link to download
                    const createObjectURL = window.URL.createObjectURL(
                        blob
                    );
                    window.api.destroy(starttime)
                    openNotificationDownload(createObjectURL)
                })
            });
        })
    }

    const openNotificationDownloadingMap = async () => {
        fetch(url, {
            method: 'GET'
        })
            .then((response) => response.blob()).then((blob) => {
                // Create blob link to download
                const createObjectURL = window.URL.createObjectURL(
                    blob
                );

                window.api.destroy(starttime)

                openNotificationDownload(createObjectURL)


            });

    }
    const openNotificationDownloading = async () => {
        if (setDownloading) setDownloading(true)
        let descriptionStart = i18next.t('common.actions.download.descriptionStart', { type: type, time: starttime })
        window.api["info"]({
            message: i18next.t('common.actions.download.processing'),
            description: <>{descriptionStart}<br />{i18next.t('common.actions.download.wait')}  <Spin></Spin></>,
            key: starttime,
            duration: 0
        });


        console.log("AAA url", url)

        if (url.toUpperCase().includes("REQUEST=GETPRINTREPORT")) {
            openNotificationDownloadingReport();
        }
        else if (url.toUpperCase().includes("REQUEST=GETPRINT")) {
            openNotificationDownloadingMap();
        }

        /*
        fetch(url).then((response) => {
            if (response.ok) {
                return response.blob();
            }            
        }).then((blob) => {
            // Do something with the response
            console.log(blob)            // Create blob link to download
            const createObjectURL = window.URL.createObjectURL(
                blob
            );
            window.api.destroy(starttime)
            openNotificationDownload(createObjectURL)
        }).catch((error) => {

            //Segundo intento
            fetch(url).then((response) => {
                if (response.ok) {
                    return response.blob();
                }                   
                //Informamos dde que algunos valores no son válidos      
                const messages = ReactDOM.createRoot(document.getElementById('messages'));
                messages.render(
                    <NotificationComponent type="error" text="download_report_error"></NotificationComponent>
                );         
            }).then((blob) => {
                // Do something with the response
                console.log(blob)            // Create blob link to download
                const createObjectURL = window.URL.createObjectURL(
                    blob
                );
                window.api.destroy(starttime)
                openNotificationDownload(createObjectURL)
            })
        });*/


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
export default DownloadComponent;