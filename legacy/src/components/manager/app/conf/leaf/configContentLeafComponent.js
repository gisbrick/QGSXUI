import { useEffect, useRef, useState } from "react";
import { Button, Card, Input, Form, Modal, Space, Spin, Table, Tooltip, Select } from "antd";
import i18next from "i18next";
import { v4 as uuid } from 'uuid';
import MapConfig from "./contentTypes/MapConfig";
import TableConfig from "./contentTypes/TableConfig";
import { ProjectsService } from "../../../../../service/projectsService";
import { QgisService } from "../../../../../service/qgisService";
import OpendataConfig from "./contentTypes/OpendataConfig";
import ReportConfig from "./contentTypes/ReportConfig";
import ScheduleConfig from "./contentTypes/ScheduleConfig";
import HtmlConfig from "./contentTypes/HtmlConfig";
import LoadingComponent from "../../../../utils/LoadingComponent";
import ExternalReportConfig from "./contentTypes/ExternalReportConfig";
import CustomAppComponentConfig from "./contentTypes/CustomAppComponentConfig";

function ConfigContentLeafComponent({ unit, config, isNew, setSelect, saveLeaf, permissions }) {

    const [loading, setLoading]= useState(false)

    const renderContentType = () => {
        if (QGISPRJ && contentType == "map") {
            return <MapConfig QGISPRJ={QGISPRJ} saveProperty={saveProperty} unit={unit} config={properties.config} properties={properties} setProperties={setProperties} permissions={permissions}></MapConfig>

        }
        else if (QGISPRJ && contentType == "table") {
            return <TableConfig QGISPRJ={QGISPRJ} saveProperty={saveProperty} unit={unit} config={properties.config} properties={properties} setProperties={setProperties} permissions={permissions}></TableConfig>
        }
        else if (QGISPRJ && contentType == "survey") {
            return <TableConfig QGISPRJ={QGISPRJ} saveProperty={saveProperty} unit={unit} config={properties.config} properties={properties} setProperties={setProperties} permissions={permissions}></TableConfig>
        }
        else if (QGISPRJ && contentType == "opendata") {
            return <OpendataConfig QGISPRJ={QGISPRJ} saveProperty={saveProperty} unit={unit} config={properties.config} properties={properties} setProperties={setProperties} permissions={permissions}></OpendataConfig>
        }
        else if (QGISPRJ && contentType == "report") {
            return <ReportConfig QGISPRJ={QGISPRJ} saveProperty={saveProperty} unit={unit} config={properties.config} properties={properties} setProperties={setProperties} permissions={permissions}></ReportConfig>
        }
        else if (QGISPRJ && contentType == "external_report") {
            return <ExternalReportConfig QGISPRJ={QGISPRJ} saveProperty={saveProperty} unit={unit} config={properties.config} properties={properties} setProperties={setProperties} permissions={permissions}></ExternalReportConfig>
        }
        else if (QGISPRJ && contentType == "schedule") {
            return <ScheduleConfig QGISPRJ={QGISPRJ} saveProperty={saveProperty} unit={unit} config={properties.config} properties={properties} setProperties={setProperties} permissions={permissions}></ScheduleConfig>
        }
        else if (QGISPRJ && contentType == "html") {
            return <HtmlConfig QGISPRJ={QGISPRJ} saveProperty={saveProperty} unit={unit} config={properties.config} properties={properties} setProperties={setProperties} permissions={permissions}></HtmlConfig>
        }
        else if (QGISPRJ && contentType == "custom_app_component") {
            return <CustomAppComponentConfig QGISPRJ={QGISPRJ} saveProperty={saveProperty} unit={unit} config={properties.config} properties={properties} setProperties={setProperties} permissions={permissions}></CustomAppComponentConfig>
        }
        //TODO AÑADIR AQUI NUEVOS TIPOS
        else {
            return <></>
        }
    }

    const getContentTypes = (QGISPRJ) => {
        let contentTypes = [{
            value: 'map',
            label: <div className="reader">{i18next.t('manager.app.contentTree.types.map')}</div>
        },
        {
            value: 'html',
            label: <div className="reader">{i18next.t('manager.app.contentTree.types.html')}</div>
        },
        {
            value: 'table',
            label: <div className="reader">{i18next.t('manager.app.contentTree.types.table')}</div>
        },
        {
            value: 'survey',
            label: <div className="reader">{i18next.t('manager.app.contentTree.types.survey')}</div>
        },
        {
            value: 'report',
            label: <div className="reader">{i18next.t('manager.app.contentTree.types.report')}</div>
        },
        {
            value: 'external_report',
            label: <div className="reader">{i18next.t('manager.app.contentTree.types.external_report')}</div>
        },
        {
            value: 'opendata',
            label: <div className="reader">{i18next.t('manager.app.contentTree.types.opendata')}</div>
        },
        {
            value: 'schedule',
            label: <div className="reader">{i18next.t('manager.app.contentTree.types.schedule')}</div>
        },
        {
            value: 'custom_app_component',
            label: <div className="reader">{i18next.t('manager.app.contentTree.types.custom_app_component')}</div>
        }]

        //TODO AÑADIR AQUI NUEVOS TIPOS
        return contentTypes;

    }
    const renderSelectType = () => {

        if (QGISPRJ) {
            let contentTypes = getContentTypes(QGISPRJ);
            return <Form.Item
                label={<div className="reader">{i18next.t('manager.app.contentTree.type')}</div>}
                name="contentType"
                rules={[
                    {
                        required: true,
                        message: i18next.t('common.msg.form.requiredField', { fieldName: i18next.t('manager.app.contentTree.type') }),
                    }
                ]}
            >
                <Select
                    showSearch
                    placeholder={i18next.t('manager.app.contentTree.selectContentType')}
                    optionFilterProp="children"
                    onChange={(e) => {
                        setContentType(e)
                        saveProperty("contentType", e)
                    }}
                    filterOption={filterOptionForHTML}
                    options={contentTypes}
                />

            </Form.Item>
        }
        else {
            return <></>
        }



    }

    const [contentType, setContentType] = useState(true);
    const [open, setOpen] = useState(true);

    const [form] = Form.useForm();
    const [fieldsChanged, setFieldsChanged] = useState(false);
    const [properties, setProperties] = useState();

    const [projects, setProjects] = useState();
    const [QGISPRJ, setQGISPRJ] = useState();

    const loadProject = (projectName, permission) => {
        setLoading(true)
        setQGISPRJ(null)
        let map = {
            unit: unit.unitName,
            permission: permission ? permission : properties?properties.permission:null,
            map: projectName ? projectName : properties?properties.project:null
        }
        if (map.map) {
            QgisService.QGISPRJ(map).then((results) => {
                setQGISPRJ(results)
                setLoading(false)
            })
        }
        
    }

    const loadProjects = (permission) => {
        saveProperty("project", null)       
       

        setProjects([])
        setQGISPRJ(null)
        ProjectsService.LISTBYUNITANDPERMISSION(unit.idUnt, "").then((results) => {
            let data = [{
                value: null,
                label: ""
            }];
            for (let i in results) {
                data.push({
                    value: results[i],
                    label: results[i]
                })
            }
            setProjects(data);
        })

        //Ya no utilziamos el permiso como nombre de directorio en la unidad. Todo debe estar en la unidad
        /*
        ProjectsService.LISTBYUNITANDPERMISSION(unit.idUnt, permission).then((results) => {
            let data = [{
                value: null,
                label: ""
            }];
            for (let i in results) {
                data.push({
                    value: results[i],
                    label: (permission ? permission + "/" : "") + results[i]
                })
            }
            setProjects(data);
        })*/
    }

    useEffect(() => {
        config.type = "LEAF"
        if (!config.key) config.key = uuid()
        if (!config.isLeaf) config.isLeaf = true
        if (!config.title) config.title = ""
        if (!config.permission) config.permission = null
        if (!config.project) config.project = null
        if (!config.height) config.height = ""
        if (!config.contentType) config.contentType = null
        if (!config.config) config.config = {}

        setContentType(config.contentType)
        setProperties({ ...config })
        form.setFieldsValue({ ...config });
        loadProjects(config.permission);
        if(config.project){
            loadProject(config.project, config.permission)
        }
    }, [])

    const saveProperty = (name, value) =>{
        if(properties){
            let copy = {...properties}
            copy[name] = value;
            setProperties(copy)
            form.setFieldsValue(copy);
        }        
    }

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    const filterOptionForHTML = (input, option) =>
        (option?.label?.props?.children ?? '').toLowerCase().includes(input.toLowerCase());

    return (
        <>
            <Modal
                title={i18next.t('manager.app.contentTree.configLeaf')}
                maskClosable={false}
                open={open}
                onOk={(e) => {
                    form.validateFields().then(async (value) => {
                        //config.title = value.title
                        //config.permission = value.permission
                        saveLeaf(properties)
                    })
                }}
                onCancel={(e) => setSelect(null)}>

                <Form
                    layout={"vertical"}
                    disabled={false} // De momento lo pongo siempre como editable... ya veremos como lo dejamos
                    onFieldsChange={(field, allFields) => {
                        //Actualizamos el valor, para que no haya que cambiar el foco del input para que se actualice
                        if (field.length > 0) properties[field[0].name[0]] = field[0].value;
                        setFieldsChanged(true);
                    }}
                    form={form}>


                    <Form.Item
                        label={i18next.t('manager.app.contentTree.treeText')}
                        name="title"
                        rules={[

                        ]}
                    >
                        <Input />
                    </Form.Item>

                    {<Form.Item
                        label={i18next.t('manager.app.contentTree.height')}
                        name="height"
                        rules={[
                        ]}
                    >
                        <Input />
                    </Form.Item>}

                    {<Form.Item
                        label={i18next.t('manager.app.prmName')}
                        name="permission"
                        rules={[
                        ]}
                    >
                        {permissions && <Select
                            showSearch
                            placeholder={i18next.t('manager.app.prmName')}
                            optionFilterProp="children"
                            onChange={(e) => {
                                //loadProjects(e)
                                saveProperty("permission", e)
                            }}
                            filterOption={filterOption}
                            options={permissions}
                        />}
                    </Form.Item>}

                    {<Form.Item
                        label={i18next.t('manager.app.contentTree.project')}
                        name="project"
                        rules={[
                            {
                                required: true,
                                message: i18next.t('common.msg.form.requiredField', { fieldName: i18next.t('manager.app.contentTree.project') }),
                            }
                        ]}
                    >
                        <Select
                            showSearch
                            placeholder={i18next.t('manager.app.contentTree.selectProject')}
                            optionFilterProp="children"
                            onChange={(e) => {
                                loadProject(e)
                                saveProperty("project", e)
                            }}
                            filterOption={filterOption}
                            options={projects}
                        />
                    </Form.Item>}


                    {loading ?<LoadingComponent/> : renderSelectType()}

                    {renderContentType()}

                </Form>

              

            </Modal>
        </>
    );
}

export default ConfigContentLeafComponent;