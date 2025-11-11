import { useEffect, useState } from "react";
import { Button, Card, Carousel, Empty, Form, Image, Modal, Row, Space, Spin, Table, Tabs } from "antd"
import { FileExcelOutlined, FilePdfOutlined, FilePptOutlined, FileTextOutlined, FileUnknownOutlined, FileWordOutlined, FileZipOutlined, SaveOutlined } from "@ant-design/icons";
import { MediaService } from "../../service/mediaService";
import MediaToolbarComponent from "./mediaToolbarComponent";
import MediaCarruselImageItem from "./mediaCarruselImageItem";


function MediaCarruselComponent({ loadMediaData, map, media, data, editable: editableAux, feature: featureAux, qgisLayer, mapView, reload, visible, setVisible }) {


    const [dataAux, setDataAux] = useState(null);
    const imageHeight = 190;
    const contentStyle = {
        height: imageHeight + 180 + "px",
        color: '#fff',
        lineHeight: imageHeight + 150 + "px",
        textAlign: 'center',
        background: '#a6acaf',
    };

    let loadImage = (index) => {
        //Descargamos solo las imágenes para previsualizar
        if (!data[index].file && data[index].mimetype.startsWith("image")) {
            MediaService.BASE64FILE(map, featureAux, data[index].uidMedRsc)
                .then((file) => {
                    let aux = [...dataAux ? dataAux : data]
                    aux[index].file = file;
                    setDataAux(aux);
                })
                .catch(err => {
                    console.log("ERROR", err);
                })
        }
    }

    let afterChangeCarousel = (current) => {
        loadImage(current)
    }


    useEffect(() => {
        setDataAux([...data]);
        loadImage(0);
    }, [data])
    
    return (<>
        {dataAux && dataAux.length == 0 && <Empty />}
        {dataAux && dataAux.length > 0 && <Carousel afterChange={afterChangeCarousel} autoplay>
            {dataAux.map((item, index) => {
                return <div  key={"MediaCarruselItem" + index}>
                    <h3 style={contentStyle}>
                        <MediaCarruselItem autoplay={true} height={imageHeight} item={item} loadMediaData={loadMediaData} map={map} media={media} data={dataAux} editable={editableAux}
                            feature={featureAux} qgisLayer={qgisLayer} mapView={mapView} reload={reload} visible={visible} setVisible={setVisible} />
                    </h3>
                </div>
            })}

        </Carousel>}
    </>)
}

export default MediaCarruselComponent;

function MediaCarruselItem({ height, item, loadMediaData, map, media, data, editable: editableAux, feature: featureAux, qgisLayer, mapView, reload, visible, setVisible }) {


    let renderTitle = () => {
        return <Space direction="vertical">
            <>{item.name + " (" + item.filename + ")"}</>
            <MediaToolbarComponent loadMediaData={loadMediaData} map={map} media={media} item={item} data={data} editable={editableAux}
                feature={featureAux} qgisLayer={qgisLayer} mapView={mapView} reload={reload} visible={visible} setVisible={setVisible} />
        </Space>
    }
    /*
   
*/

    return (
        <>
            <div>
                <Card
                    title={renderTitle()}
                    style={{
                        width:"fit-content",
                        padding:"10px",
                        margin:"0 auto"
                    }}>
                    {item.mimetype && item.mimetype.startsWith("image") &&
                        <MediaCarruselImageItem height={height} item={item} />
                    }
                    {item.mimetype && !(item.mimetype.startsWith("image")) &&
                        <MediaCarruselOtherItem height={height} item={item} loadMediaData={loadMediaData} map={map} media={media} data={data} editable={editableAux}
                            feature={featureAux} qgisLayer={qgisLayer} mapView={mapView} reload={reload} visible={visible} setVisible={setVisible} />
                    }
                </Card>
            </div>



        </>
    )
}




function MediaCarruselOtherItem({ height, item, loadMediaData, map, media, data, editable: editableAux, feature: featureAux, qgisLayer, mapView, reload, visible, setVisible }) {

    let excelMimeTypes = ["application/vnd.ms-excel (official)",
        "application/msexcel",
        "application/x-msexcel",
        "application/x-ms-excel",
        "application/x-excel",
        "application/x-dos_ms_excel",
        "application/xls",
        "application/x-xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

    let pdfMimeTypes = ["application/pdf"];

    let pptMimeTypes = ["application/vnd.ms-powerpoint", " application/vnd.openxmlformats-officedocument.presentationml.presentation"];

    let wordMimeTypes = ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.wordprocessingml.template"];

    let zipMimeTypes = ["application/zip", "application/octet-stream", "application/x-zip-compressed", "multipart/x-zip"];

    let warMimeTypes = ["application/vnd.rar", "application/x-rar-compressed", "application/octet-stream"];

    let textMimeTypes = ["text/plain"];


    let renderIcon = () => {
        if (excelMimeTypes.includes(item.mimetype)) {
            return <FileExcelOutlined />
        }
        else if (pdfMimeTypes.includes(item.mimetype)) {
            return <FilePdfOutlined />
        }
        else if (pptMimeTypes.includes(item.mimetype)) {
            return <FilePptOutlined />
        }
        else if (wordMimeTypes.includes(item.mimetype)) {
            return <FileZipOutlined />
        }
        else if (textMimeTypes.includes(item.mimetype)) {
            return <FileTextOutlined />
        }
        else {
            return <FileUnknownOutlined />
        }
    }

    let renderType = () => {
        return <div style={{ fontSize: height / 2 }}>
            {renderIcon()}
        </div>
    }

    return (
        <>
            {renderType()}
        </>
    )
}



