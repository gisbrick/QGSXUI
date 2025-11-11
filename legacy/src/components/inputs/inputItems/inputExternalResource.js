import { useEffect, useState } from "react"
import { Button, Form, Space, Upload } from "antd";
import MediaFormViewCarrousel from "../../media/mediaFormViewCarrousel";
import MediaViewDocument from "../../media/mediaViewDocument";
import i18next from "i18next";
import { decodeFileToBase64, getFormatFromBase64Attachment } from "../../../utilities/valueUtils";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";

const InputExternalResource = ({ map, setFieldsChanged, form, feature, properties, editable, field, alias, qgisLayer, valueChanged, getRules, letterSizeForm, letterTypeForm, letterColorForm }) => {
    const imageHeight = 190;
    const [loadingImage, setLoadingImage] = useState(true)
    const [selectedFile, setSelectedFile] = useState([])
    const [formatosValidos, setFormatosValidos] = useState([])
    const [error, setError] = useState(false)

    const dummyUploadRequest = ({ file, onSuccess }) => {
        setTimeout(() => {
            onSuccess("ok");
        }, 0);
    };
    const getFormatosValidos = (field) => {
        let formatConstraints = field.constraints.constraintExpression.toLowerCase()
        let regex = /(?<={).*?(?=})/g
        let result = formatConstraints.match(regex)
        setFormatosValidos(result)
    }


    const uploadProps = {
        multiple: false,
        customRequest: dummyUploadRequest,
        onRemove: (file) => {
            setSelectedFile(null);
        },
        onChange: (info) => {
        },
        beforeUpload: async (file) => {
            //let formatosValidos = getFormatosValidos(field)
            if (formatosValidos.length > 0) {
                const maxFileSize = 5 * 1024 * 1024; // 5MB limit
                if (file.size > maxFileSize) {
                    setError(true)
                    return false;
                }
                formatosValidos.forEach(async (formato) => {
                    if (file.type.includes(formato)) {
                        setSelectedFile(file);
                        //codificar el archivo a base64 y subirlo
                        let base64 = await decodeFileToBase64(file)

                        valueChanged(base64)
                        form.setFieldValue(field.name, base64)
                        setFieldsChanged(true);
                        return true
                    }
                })
                return false
            }

            setSelectedFile(file);
            let base64 = await decodeFileToBase64(file)

            valueChanged(base64)
            form.setFieldValue(field.name, base64)
            setFieldsChanged(true);

            return true;


        },
        fileList: selectedFile ? [selectedFile] : [],
        showUploadList: {
            extra: ({ size = 0 }) => (
                <span style={{ color: '#cccccc' }}>({(size / 1024 / 1024).toFixed(2)}MB)</span>
            ),
            showDownloadIcon: true,
            downloadIcon: 'Download',
            showRemoveIcon: true,
            removeIcon: <DeleteOutlined />,
        },
    };

    const render = () => {
        if (editable) {
            //desarrollar un input que permita seleccionar un fichero del tipo acoptado y guardarlo como base64
            return <>
                {error && <div class="ant-form-item-explain-error">{i18next.t('common.actions.media.error')}</div>}
                <Upload {...uploadProps} >
                    <Button onClick={() => setError(false)}>
                        <Space>
                            <UploadOutlined />
                            {i18next.t('common.actions.media.selectFile')}
                        </Space>
                    </Button>
                </Upload>
            </>
        }
        else {
            /**
             * Identificar el tipo de archivo multimedia que contiene la feature.
             * Se puede desarrollar una función en Utils que identifique el formato del archivo, 
             * para renderizar un componente u otro
             */
            return <>
                {
                    getFormatFromBase64Attachment(properties, field) != 0 && loadingImage ?
                        getFormatFromBase64Attachment(properties, field).includes("image")
                            ? <MediaFormViewCarrousel map={map} feature={feature} height={imageHeight} data={[]} setLoadingImage={setLoadingImage}></MediaFormViewCarrousel>
                            : <MediaViewDocument feature={feature} field={field} properties={properties}></MediaViewDocument>
                        : <div className={qgisLayer.name + "_" + alias}>{i18next.t("common.msg.results.noData")}</div>
                }
            </>
        }
    }

    useEffect(() => {
        getFormatosValidos(field)
    }, [])

    return (
        <>{
            <Form.Item name={field.name} label={<span className="reader" style={{ fontFamily: letterTypeForm, fontSize: letterSizeForm + "px", fontWeight: "bold" }}>{alias}</span>} rules={getRules()}>
                {render()}
            </Form.Item>
        }
        </>
    )
}

export default InputExternalResource