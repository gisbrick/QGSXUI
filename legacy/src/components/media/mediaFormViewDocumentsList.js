import i18next from "i18next";
import { List, Avatar, Tooltip, Button, Space } from "antd";
import { MediaService } from "../../service/mediaService";
import {
    FileExcelFilled,
    FilePdfFilled,
    FileImageFilled,
    FileWordFilled,
    FileZipFilled,
    DownloadOutlined,
    FileTextFilled,
    FilePptFilled,
    FileFilled
} from "@ant-design/icons";

const MediaFormViewDocumentsList = ({ map, feature, data }) => {

    const icons = [
        {
            type: ["pdf"],
            icon: <FilePdfFilled />
        },
        {
            type: ["png", "jpg", "jpeg"],
            icon: <FileImageFilled />,
        },
        {
            type: ["zip", "rar"],
            icon: <FileZipFilled />
        },
        {
            type: ["xlsx", "csv", "xls"],
            icon: <FileExcelFilled />
        },
        {
            type: ["docx"],
            icon: <FileWordFilled />
        },
        {
            type: ["txt"],
            icon: <FileTextFilled />
        },
        {
            type: ["pptx"],
            icon: <FilePptFilled />
        }
    ]

    let downloadFile = (map, feature, uidMedRsc) => {
        MediaService.DOWNLOAD(map, feature, uidMedRsc);
    }


    return (<List
        itemLayout="horizontal"
        dataSource={data}
        renderItem={(item, index) => {
            return <List.Item
            >
                <List.Item.Meta
                    avatar={<Avatar icon={icons.find(icon => icon.type.includes(item.filename.split(".")[1]))
                        ? icons.find(icon => icon.type.includes(item.filename.split(".")[1])).icon
                        : <FileFilled />
                    }></Avatar>}
                //title={<div style={{visibility:"hidden"}}>{"haha"}</div>}
                //description={<div>{item.description}</div>}
                style={{flex:0}}
                />
                    <div style={{flex:1, display:"flex", alignItems: "center"}}>
                        <b style={{ wordBreak: "break-all", flex: 1 }}>{item.filename}</b>
                        {/* BOTON DESCARGAR*/}
                        {<Tooltip placement="right" title={i18next.t('common.actions.download.download')} key={"media.download"}>
                            <Button size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                                onClick={(e) => {
                                    downloadFile(map, feature, item.uidMedRsc);
                                    window.mouseOverButton = false
                                }}
                                type={"default"} shape="circle">
                                <DownloadOutlined />
                            </Button>
                        </Tooltip>
                        }
                    </div>

            </List.Item>
        }
        }
    />);

}

export default MediaFormViewDocumentsList;