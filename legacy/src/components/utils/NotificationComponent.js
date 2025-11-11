import { Button, notification} from 'antd';
import i18next from "i18next";
import { useEffect } from 'react';

const NotificationComponent = ({ type, text, description }) => {
    //const [api, contextHolder] = notification.useNotification();
    
    useEffect(() => {
        openNotificationWithIcon(type);
    }, [])

    const getTitle = (type) => { 
        if(type == "error"){
            return i18next.t('common.notification.error.title')
        }
        if(type == "success"){
            return i18next.t('common.notification.success.title')
        }
        else{
            return i18next.t('common.notification.info.title')
        }
    }

    const openNotificationWithIcon = (type) => {        
        window.api[type]({
            message: getTitle(type),
            description: i18next.t('common.notification.' + type + '.' + text) + (description?" : " + description + "":""),
            duration: 5,
        });

    };

   
    return (
        <>
            {/*contextHolder*/}
        </>
    )
};
export default NotificationComponent;