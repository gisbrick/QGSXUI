import i18next from "i18next";
import { useState} from "react"
import { Space, Tooltip, Button, FloatButton } from "antd";
import { HeartFilled } from "@ant-design/icons";

const FavouriteSelector = ({favouriteAppsSelect, setFavouriteAppsSelect}) => {

    return (
        <Space>
            <Tooltip title={i18next.t('common.actions.favourites')}>
                <FloatButton type="primary" icon={<HeartFilled />} /*style={{ zIndex: 20, position: "sticky", top: "50%", left: "10%" }}*/
                onClick={(e) =>{setFavouriteAppsSelect(!favouriteAppsSelect);}} />
            </Tooltip>
        </Space>
    )
}

export default FavouriteSelector;