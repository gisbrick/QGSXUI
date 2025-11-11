import { Image, Spin } from "antd";

const MediaCarruselImageItem = ({ height, item }) => {

    let renderImage = () => {
        let url = "data:" + item.mimetype + ";base64," + item.file.base64File;
        return <>
            <Image
                height={height}
                src={url}
            />
        </>
    }

    return (
        <>
        {item.file && renderImage()
        }
        {!item.file && <Spin  className="ant-spin-centered"/>}
    </>
    )
}

export default MediaCarruselImageItem;
