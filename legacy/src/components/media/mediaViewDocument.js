import { FileExcelFilled, FilePdfFilled, FilePptFilled, FileTextFilled, FileWordFilled, FileZipFilled } from "@ant-design/icons";
import { getFormatFromBase64Attachment } from "../../utilities/valueUtils";
import { Tooltip } from "antd";


const MediaViewDocument = ({ feature, field, properties }) => {

    const iconSize = {
        fontSize: "60px"
    }

    const icons = [
        {
            type: ["pdf"],
            icon: <FilePdfFilled style={iconSize} />
        },
        {
            type: ["zip", "rar"],
            icon: <FileZipFilled style={iconSize} />
        },
        {
            type: ["xlsx", "csv", "xls"],
            icon: <FileExcelFilled style={iconSize} />
        },
        {
            type: ["docx"],
            icon: <FileWordFilled style={iconSize} />
        },
        {
            type: ["txt"],
            icon: <FileTextFilled style={iconSize} />
        },
        {
            type: ["pptx"],
            icon: <FilePptFilled />
        }
    ]

    const recuperarIcono = (feature, field, properties) => {
        let formato = getFormatFromBase64Attachment(properties, field)

        let icono = icons.filter((icon) => formato.includes(icon.type[0]) ? true : false)[0]
        return (
            <>
                <Tooltip title="Clica para verlo">
                    <div style={{width:"fit-content"}} onClick={() => { window.open(properties[field.name], "_blank") }}>{icono.icon}</div>
                </Tooltip>
            </>
        )
    }

    return (recuperarIcono(feature, field, properties))

}

export default MediaViewDocument;