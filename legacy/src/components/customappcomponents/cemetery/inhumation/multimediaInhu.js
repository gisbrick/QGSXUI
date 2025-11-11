import { useState } from "react";
import { CloseOutlined, FileAddOutlined } from "@ant-design/icons";
import { Button, List, Space, Tooltip } from "antd";
import i18next from "i18next";
import MediaFormComponentModalInput from "../../../media/mediaFormComponentModalInput";

const MultimediaInhu = ({ qgisLayer, files, setFiles }) => {

    const [viewInsert, setViewInsert] = useState();
    const [filesControlState, setFilesControlState] = useState(files)

    let media = null;
    if (qgisLayer && qgisLayer.customProperties && qgisLayer.customProperties.URBEGIS_MEDIA) {
        media = JSON.parse(qgisLayer.customProperties.URBEGIS_MEDIA)
    }

    const removeFile = (index) => {
        let arrayAux = [...filesControlState]
        if (index > -1) {
            arrayAux.splice(index, 1);
        }
        setFiles(arrayAux)
        setFilesControlState(arrayAux)
    }

    let insertFile = () => {
        setViewInsert(true)
    }

    return (
        <>
            {qgisLayer && qgisLayer.customProperties && qgisLayer.customProperties.URBEGIS_MEDIA &&
                <Space direction="vertical">
                    <List
                        itemLayout="horizontal"
                        dataSource={filesControlState}
                        renderItem={(item, index) => (
                            <List.Item>
                                <div>{item.name}</div>
                                <Tooltip title={i18next.t('common.actions.media.delete')} placement="right">
                                    <Button shape="circle" onClick={() => removeFile(index)} icon={<CloseOutlined />}></Button>
                                </Tooltip>
                            </List.Item>
                        )}
                    ></List>
                    {media && media.capabilities && media.capabilities.allowInsert &&
                        <Button type="primary"
                            disabled={false} onClick={(e) => insertFile()}>
                            <Space>
                                <FileAddOutlined />
                                {i18next.t('common.actions.media.insert')}
                            </Space>

                        </Button>}
                </Space>
            }
            {viewInsert && <MediaFormComponentModalInput
                item={null} qgisLayer={qgisLayer}
                visible={viewInsert} setVisible={setViewInsert}
                files={files} setFiles={setFiles}
                filesControlState={filesControlState} setFilesControlState={setFilesControlState}
            ></MediaFormComponentModalInput>}
        </>
    );

}

export default MultimediaInhu;