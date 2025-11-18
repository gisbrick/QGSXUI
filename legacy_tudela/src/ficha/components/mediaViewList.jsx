import { useContext, useEffect, useState } from "react"
import { ConfigMapContext } from "../../context/configMapProvider"
import { List, Avatar, Tooltip, Button } from "antd";
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

const MediaViewList = ({ files }) => {

    const invalidFormats = ["jpg", "jpeg", "png"]
    const [validFiles, setValidFiles] = useState([])

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

  //TODO - MODIFICAR EL CÓDIGO YA QUE YA NO SE NECESITA ESTE FILTRADO

    const getFilesImages = (files) => {
        const validFiles = files.filter((file) => {
            const nameandformat = file.ruta.split("/")[file.ruta.split("/").length - 1]
            const format = nameandformat.substring(nameandformat.lastIndexOf(".") + 1)
            let permission =  true
            return !invalidFormats.includes(format.toLowerCase()) && permission
        }).map((file) => {
            const nameandformat = file.ruta.split("/")[file.ruta.split("/").length - 1]
            const name = nameandformat.split(".")[0].toLowerCase()
            const format = nameandformat.substring(nameandformat.lastIndexOf(".") + 1).toLowerCase()
            return {
                ...file,
                name,
                format
            }
        })
        return validFiles
    }


    useEffect(() => {
        setValidFiles([])
        const i = getFilesImages(files)
        setValidFiles(i)
    }, [files])


    return (
        validFiles.length > 0 && <>
            <div style={{ width:"auto",}}>
                <List
                    itemLayout="horizontal"
                    dataSource={validFiles}
                    renderItem={(item, index) => {
                        return <List.Item style={{justifyContent: "center"}}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <List.Item.Meta
                                avatar={<Avatar icon={icons.find(icon => icon.type.includes(item.format))
                                    ? icons.find    (icon => icon.type.includes(item.format)).icon
                                    : <FileFilled />
                                }></Avatar>}
                               
                            />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{item.name}</span>
                                {/* BOTON DESCARGAR*/}
                                {
                                    <Tooltip placement="right" title={"Descargar"} key={"media.download"}>
                                        <Button size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                                            onClick={(e) => {
                                                const downloadLink = document.createElement("a");
                                                downloadLink.href = item.url;
                                                downloadLink.download = item.name;
                                                downloadLink.click();
                                                window.mouseOverButton = false
                                            }}
                                            type={"default"} shape="circle">
                                            <DownloadOutlined />
                                        </Button>
                                    </Tooltip>
                                }
                            </div>
                            </div>
                        </List.Item>
                    }
                    }
                />
            </div>

        </>
    );

}

export default MediaViewList