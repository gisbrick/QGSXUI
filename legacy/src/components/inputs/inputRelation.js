import { useEffect, useState } from "react";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Card, Checkbox, Col, DatePicker, Form, Input, InputNumber, Row, Select, Slider, Table, TimePicker } from "antd";
import dayjs from 'dayjs';
import TextArea from "antd/es/input/TextArea";
import RichTextEditor from "react-rte";
import HtmlEditor from "./custom/htmlEditorComponent";
import i18next from "i18next";
import { QgisService } from "../../service/qgisService";
import { getLayerFieldsByIndexes, getOrderedFields, getQgisLayerByLayerId } from "../../utilities/mapUtils";
import ValueComponet from "../values/valueComponet";
dayjs.extend(customParseFormat);


const InputRelation = ({ QGISPRJ, map, setFieldsChanged, form, feature, properties, qgisLayer, editable, mapView, reload, tab }) => {

    const referencedLayer = getQgisLayerByLayerId(QGISPRJ, tab.relation.referencedLayerId)
    const referencingLayer = getQgisLayerByLayerId(QGISPRJ, tab.relation.referencingLayerId)

    const referencedFields = getLayerFieldsByIndexes(referencedLayer, JSON.parse(tab.relation.referencedFields))
    const referencingFields = getLayerFieldsByIndexes(referencingLayer, JSON.parse(tab.relation.referencingFields))

    const [features, setFeatures] = useState()
    const [totalRows, setTotalRows] = useState(1);
    const [fieldsValueRelations, setFieldsValueRelations] = useState();
    const [loading, setLoading] = useState(false);
    const [columns, setColumns] = useState();
    const [sortBy, setSortBy] = useState();
    const [dataSource, setDataSource] = useState([]);
    const [page, setPage] = useState();
    const [pageSize, setPageSize] = useState();



    const fieldsHasValues = (fields) => {
        if (!feature || !feature.properties) return false
        let out = true;
        for (let i in fields) {
            if (out) {
                if (!feature.properties[fields[i].name]) {
                    out = false
                }
            }
        }
        return out
    }

    const loadValueRelations = async (fields) => {
        //Inicio las value relation     
        let fieldsValueRelationsCopy = {}
        for (let i in fields) {
            let field = fields[i]
            let config = JSON.parse(field.editorWidgetSetup.config);
            if (field.editorWidgetSetup.type == "ValueRelation") {
                //alert("TODO TOÑO NO SIEMBRE INICIALIZA BIEN LAS VALUERELATIONS")
                setFieldsValueRelations(null)
                fieldsValueRelationsCopy[field.name] = await QgisService.GETFEATURES(map, config.LayerName, 10000, 0, config.FilterExpression, null, null, null)
                    .then((data) => {
                        let newValues = {}
                        for (var i in data.features) {
                            let feature = data.features[i];
                            newValues[feature.properties[config.Key]] = feature.properties[config.Value]
                        }
                        return newValues
                    })
                    .catch(err => {
                        console.log("ERROR", err);
                    })
            }
        }
        setFieldsValueRelations(fieldsValueRelationsCopy)
        initColumns(fields, fieldsValueRelationsCopy)
    }

    const initColumns = (fields, fieldsValueRelationsCopy) => {
        let columnsAux = [];

        for (var i in fields) {
            let field = fields[i];
            let column = {
                title: <>
                    {field.alias ? field.alias : field.name}
                    <div style={{ position: "absolute", width: "10px", height: "100%", top: "10px", right: "10px", cursor: "pointer", zIndex: "5" }} >{renderSort(fields[i])}</div>
                </>,
                dataIndex: field.name,
                render: (_, feature, index) => {
                    return <ValueComponet map={map} fieldsValueRelations={fieldsValueRelationsCopy} feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={referencingLayer}></ValueComponet>
                }
            }
            columnsAux.push(column);
        }

        setColumns(columnsAux);
    }

    const fieldsValues = (fields) => {
        let out = [];
        for (let i in fields) {
            if(feature.properties && fields[i].name in feature.properties){
                out.push(feature.properties[fields[i].name])
            }            
        }
        return out
    }



    const renderSort = (field) => {
        if (sortBy == field.name + " ASC") {
            return <span onClick={(e) => {
                setSortBy(field.name + " DESC")
            }} className="ant-table-column-sorter ant-table-column-sorter-full"><span className="ant-table-column-sorter-inner" aria-hidden="true"><span role="img" aria-label="caret-up" className="anticon anticon-caret-up ant-table-column-sorter-up active"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-up" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z"></path></svg></span><span role="img" aria-label="caret-down" className="anticon anticon-caret-down ant-table-column-sorter-down"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></span></span></span>;
        }
        else if (sortBy == field.name + " DESC") {
            return <span onClick={(e) => {
                setSortBy(null)
            }} className="ant-table-column-sorter ant-table-column-sorter-full"><span className="ant-table-column-sorter-inner" aria-hidden="true"><span role="img" aria-label="caret-up" className="anticon anticon-caret-up ant-table-column-sorter-up"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-up" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z"></path></svg></span><span role="img" aria-label="caret-down" className="anticon anticon-caret-down ant-table-column-sorter-down active"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></span></span></span>;
        }
        else {
            return <span onClick={(e) => {
                setSortBy(field.name + " ASC")
            }} className="ant-table-column-sorter ant-table-column-sorter-full"><span className="ant-table-column-sorter-inner" aria-hidden="true"><span role="img" aria-label="caret-up" className="anticon anticon-caret-up ant-table-column-sorter-up"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-up" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z"></path></svg></span><span role="img" aria-label="caret-down" className="anticon anticon-caret-down ant-table-column-sorter-down"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></span></span></span>;
        }
    }

    useEffect(() => {
        let fields = getOrderedFields(referencingLayer, true);
        setFieldsValueRelations(null)
        loadValueRelations(fields)
        fetchRecords(1, 10);
    }, [sortBy])


    const fetchRecords = (page, pageSize) => {
        setPage(page)
        setPageSize(pageSize)
        setLoading(true);

        let referencedFieldsValues = fieldsValues(referencedFields)
        let query = " 1=1 "
        let orderBy = " 1=1 "
        for (let i in referencingFields) {
            query = query + " AND " + referencingFields[i].name + " = '" + referencedFieldsValues[i] + "'"
        }

        QgisService.GETCOUNTFEATURES(map, referencingLayer.name, null, null, query, null, referencingLayer.sortby)
            .then((data) => {
                setTotalRows(data.numberOfFeatures);
            })
            .catch(err => {
                console.log("ERROR", err);
            });


        let sort_by, sort_type = null;
        if (sortBy) {
            let sortValues = sortBy.split(" ")
            sort_by = sortValues[0]
            sort_type = sortValues[1]
        }

        let startIndex = (page - 1) * pageSize


        QgisService.GETFEATURES(map, referencingLayer.name, pageSize, startIndex, query, null, sort_by, sort_type)
            .then((data) => {
                setLoading(false);
                setFeatures(data.features)
                let datasourceAux = []
                for (let i in data.features) {
                    //data.features[i].properties["URBEGIS_FEATURE_ID"] = data.features[i].id;
                    datasourceAux.push(data.features[i])
                }
                setDataSource(datasourceAux)
            })
            .catch(err => {
                console.log("ERROR", err);
            });
    }


    let renderInput = () => {
        return <Card
            size="small"
            title={i18next.t('common.msg.results.linked', { 'to': referencingLayer.name })}
            bordered={true}
            style={{}}><div style={{overflow: "auto"}}><Table
                loading={loading}
                columns={columns}
                dataSource={dataSource}
                pagination={{
                    total: totalRows,
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '25', '50'],

                    onChange: (page, pageSize) => {

                        fetchRecords(page, pageSize);
                    },
                }}
                bordered
            ></Table>
            </div>
        </Card>


    }



    return (
        <div style={{ padding: "5px" }}>
            {renderInput()}
        </div>

    )
};

export default InputRelation;

