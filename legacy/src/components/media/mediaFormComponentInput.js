import { CloseCircleTwoTone, SaveOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Form, Input, Modal, Row, Space, Spin, Upload } from "antd";
import TextArea from "antd/es/input/TextArea";
import i18next from "i18next";
import dayjs from 'dayjs';
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

const MediaFormComponentInput = forwardRef(({ item, setVisible, files, setFiles, filesControlState, setFilesControlState}, ref) => {

    const [form] = Form.useForm();
    let [properties, setProperties] = useState();
    const [fieldsChanged, setFieldsChanged] = useState(false);
    //const [saving, setSaving] = useState();
    const [selectedFile, setSelectedFile] = useState();
    const [showModalConfirmExit, setShowModalConfirmExit] = useState(false);

    const getDateValue = (value) => {
        if (value != null) {
            return dayjs(value)
        }
        else {
            return null;
        }
    }

    const getFileRules = (value) => {
        return [
            {
                required: true, message: i18next.t('common.msg.form.requiredField', { 'fieldName': i18next.t('common.actions.media.file') }),
                validator: (rule, value, cb) => {
                    let valid = selectedFile != null;
                    if (valid) {
                        return Promise.resolve();
                    }
                    else {
                        return Promise.reject(new Error(i18next.t('common.msg.form.requiredField', { 'fieldName': i18next.t('common.actions.media.file') })));
                    }
                }
            }
        ]

    }


    const dummyUploadRequest = ({ file, onSuccess }) => {
        setTimeout(() => {
            onSuccess("ok");
        }, 0);
    };

    const uploadProps = {
        multiple: false,
        customRequest: dummyUploadRequest,
        onRemove: (file) => {
            setSelectedFile(null);
        },
        onChange: (info) => {

        },
        beforeUpload: (file) => {
            setSelectedFile(file);
            setFieldsChanged(true);
            return true;


        },
        fileList: selectedFile ? [selectedFile] : []
    }

    const reloadForm = () => {
        //Si es un nbuevo elemento (insert), habilitamos desde el primer momento el botón de guardar
        if (!item) {
            item = {}
            item["datepublish"] = new Date();
        }

        let propsAux = item ? { ...item } : {};
        setProperties(propsAux)

        form.setFieldsValue(propsAux);
    }

    const create = (properties) => {
        let props = {};
        props["name"] = properties["name"] && properties["name"] != "undefined" ? properties["name"] : ""
        props["description"] = properties["description"] && properties["description"] != "undefined" ? properties["description"] : ""

        if (properties["datepublish"]) {
            if (typeof properties["datepublish"] === 'string' || properties["datepublish"] instanceof String) {
                props["datepublish"] = dayjs(properties["datepublish"]).toDate()
            }
            else if (properties["datepublish"] instanceof Date) {
                props["datepublish"] = properties["datepublish"];
            }
            else {
                props["datepublish"] = properties["datepublish"].toDate()
            }
        }

        if (selectedFile && selectedFile != undefined) {
            props["file"] = selectedFile;
        }
        let filesAux = []

        if(filesControlState) {
            filesAux = [...filesControlState]
            filesAux.push(props)
            setFiles(filesAux)
            setFilesControlState(filesAux)
        } else {
            filesAux = [...files]
            filesAux.push(props)
            setFiles(filesAux)
        }
        

        setVisible(false)
    }

    const handleOk = () => {
        form.validateFields().then((value) => {
            create(properties);
            setVisible(false);
        }).catch((err) => {
            let errors = []
            for (let i in err.errorFields) {
                for (let n in err.errorFields[i].errors) {
                    errors.push(err.errorFields[i].errors[n])
                }
            }
        })
    }

    const handleOkAndExit = () => {
        form.validateFields().then((value) => {
            create(properties);
        }).catch((err) => {
            let errors = []
            for (let i in err.errorFields) {
                for (let n in err.errorFields[i].errors) {
                    errors.push(err.errorFields[i].errors[n])
                }
            }
        })
    }

    const handleCancel = () => {
        if (fieldsChanged) {
            setShowModalConfirmExit(true);
        }
        else {
            handleConfirmCancel();
        }
    }

    const handleConfirmCancel = () => {
        setVisible(false);
    }

    useImperativeHandle(ref, () => ({
        imperativeHandleCancel() {
            handleCancel();
        }
    }), [handleCancel]);

    useEffect(() => {
        reloadForm();
    }, [])

    return (
        <>
            {properties &&
                <Card
                    size="small"
                    bordered={true}
                    style={{}}>
                    <Form
                        layout={"vertical"}
                        disabled={false} // De momento lo pongo siempre como editable... ya veremos como lo dejamos
                        onFieldsChange={(field, allFields) => {
                            //Actualizamos el valor, para que no haya que cambiar el foco del input para que se actualice
                            if (field.length > 0) properties[field[0].name[0]] = field[0].value;
                            setProperties(properties)
                            setFieldsChanged(true);
                        }}
                        form={form}>

                        {<Form.Item style={{ marginleft: 'auto' }}>
                            <Row justify={"end"}>
                                <Space>
                                    {<Button type="primary" htmlType="submit" onClick={handleOk}>
                                        <Space>
                                            <SaveOutlined />
                                            {i18next.t('common.actions.save.name')}
                                        </Space>

                                    </Button>
                                    }

                                    <Button htmlType="button" onClick={handleCancel}>
                                        <Space>
                                            <CloseCircleTwoTone />
                                            {i18next.t('common.actions.exit.name')}
                                        </Space>

                                    </Button>
                                </Space>
                            </Row>
                        </Form.Item>}

                        <Form.Item label={i18next.t('common.actions.media.name_')} name={"name"}
                            rules={[
                                { required: true, message: i18next.t('common.msg.form.requiredField', { 'fieldName': i18next.t('common.actions.media.name_') }) }
                            ]}>
                            <Input />
                        </Form.Item>

                        <Form.Item label={i18next.t('common.actions.media.description')} name={"description"}>
                            <TextArea rows={4} />
                        </Form.Item>


                        <Form.Item label={i18next.t('common.actions.media.date')} name={"datepublish"}
                            defaultValue={("datepublish" in properties ? getDateValue(properties["datepublish"]) : dayjs())} getValueProps={(i) => ({ value: getDateValue(i) })}
                            rules={[
                                { required: true, message: i18next.t('common.msg.form.requiredField', { 'fieldName': i18next.t('common.actions.media.date') }) }
                            ]}>
                            <DatePicker format={'DD/MM/YYYY'} />
                        </Form.Item>

                        <Form.Item label={i18next.t('common.actions.media.file')} name={"file"} rules={
                            getFileRules()
                        }>

                            <Upload {...uploadProps}>
                                <Button>
                                    <Space>
                                        <UploadOutlined />
                                        {i18next.t('common.actions.media.selectFile')}
                                    </Space>
                                </Button>
                            </Upload>
                        </Form.Item>
                    </Form>
                </Card>
            }
            {showModalConfirmExit && <Modal title={i18next.t('common.msg.pendingSave.title')}
                okText={i18next.t('common.actions.yes.name')} okButtonProps={{ disabled: false }}
                cancelText={i18next.t('common.actions.no.name')} cancelButtonProps={{ disabled: false }}
                open={showModalConfirmExit} onOk={handleOkAndExit} onCancel={handleConfirmCancel}>
                <p>{i18next.t('common.msg.pendingSave.content')} </p>
            </Modal>}
        </>
    );
})

export default MediaFormComponentInput;