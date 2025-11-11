import { forwardRef, useEffect, useImperativeHandle, useState, useRef } from "react";
import { BugTwoTone, CaretDownOutlined, CheckOutlined, QuestionCircleOutlined, DeleteOutlined, FilterOutlined, PlusOutlined, SettingOutlined } from "@ant-design/icons";
import { Button, Card, Col, DatePicker, Form, Input, Popover, Row, Select, Space, Tabs, Tooltip, Tour } from "antd";
import { Content } from "antd/es/layout/layout";
import i18next from "i18next";
import { refreshWMSLayer, getFieldsOrdererdName } from "../../../../utilities/mapUtils";
import { Reactor } from "../../../../utilities/EventsUtilities";
import { getBooleanTypes, getDateTypes, getFloatTypes, getIntegerTypes } from "../../../../utilities/valueUtils";
import InputFilterComponet from "../../../inputs/inputFilterComponent";
import { BrowserView, MobileView } from "react-device-detect";
import { useDispatch, useSelector } from 'react-redux';
import { query_state, cambio } from "../../../../features/query/querySlice";
import { cerrar } from "../../../../features/popOverFilter/popOverFilterSlice";


function AttributesFilterComponent({ QGISPRJ, map, mapView, qgisLayer, reloadTable, /*setShowDrawerToc, setPopoverFilterVisible*/ }) {

    const [form] = Form.useForm();
    const [expressions, setExpressions] = useState()
    const [fields, setFields] = useState()
    const [currentFilter, setCurrentFilter] = useState()
    const [tourOpen, setTourOpen] = useState(false)
    const [stepsRoot, setStepsRoot] = useState([])

    const dispatch = useDispatch();

    const botonAddQuery = useRef(null)
    const botonExecute = useRef(null)
    const divExpression = useRef(null)


    const initFields = () => {
        let fieldsCopy = []
        let formularioFields = getFieldsOrdererdName(qgisLayer, true)
        for (let i in qgisLayer.fields) {
            let f = qgisLayer.fields[i];
            if (formularioFields.includes(f.name)) {
                let label = f.alias ? f.alias : f.name
                let value = {
                    value: f.name,
                    label: label
                }
                if (f.editorWidgetSetup) {
                    if (f.editorWidgetSetup.type != "Hidden") {
                        fieldsCopy.push(value)
                    }
                }
                else {
                    fieldsCopy.push(value)
                }
            }


        }
        setFields(fieldsCopy)
    }

    const loadHelpsteps = () => {
        let steps = []

        steps.push({
            title: i18next.t('common.tools.help.filter.add.button.title'),
            description: i18next.t('common.tools.help.filter.add.button.description'),
            //placement: 'top',
            target: () => botonAddQuery.current,
        })

        if(fields && expressions && hasExpressions()) {
            steps.push({
                title: i18next.t('common.tools.help.filter.queries.query.title'),
                description: i18next.t('common.tools.help.filter.queries.query.description'),
                //placement: 'top',
                target: () => divExpression.current,
            })
        }

        if(expressions && hasExpressions()) {
            steps.push({
                title: i18next.t('common.tools.help.filter.execute.button.title'),
                description: i18next.t('common.tools.help.filter.execute.button.description'),
                //placement: 'top',
                target: () => botonExecute.current,
            })
        }

        setStepsRoot(steps)
    }


    const getTourSteps = () => {
        return stepsRoot
    }

    useEffect(() => {
        initFields()
        setExpressions([])
    }, [])

    useEffect(() => {
        loadHelpsteps()
    }, [expressions])

    useEffect(() => {
        if (qgisLayer.filter == null) {
            setExpressions([])
        }
    }, [qgisLayer.filter])

    const addExpression = () => {

        let uuid = Math.random().toString(36).slice(-6);

        let expressionsCopy = [...expressions]
        expressionsCopy.push({
            id: uuid,
            field: null,
            comparator: null,
            value: null
        })
        setExpressions(expressionsCopy)
    }

    const hasExpressions = () => {
        const expresionsActives = expressions.filter((object, i) => !object.disabled);
        return expresionsActives.length > 0
    }

    /**
     * Modifica el estado global boolean de la query. 
     * De esta forma esta modificación de estado se puede aprovechar en otros componenetes para activar UseEffects() y renderizarlos.
     */
    const handleCambioQuery = () => {
        dispatch(cambio())
    }

    const deleteExpression = (index) => {
        //TODO Lo siguiente funciona, pero no está bien, pero hay un problema que no mantiene los valores de las expresiones al borrarlas del array de expressions
        let expressionsCopy = [...expressions]
        expressionsCopy[index].disabled = true
        setExpressions(expressionsCopy)
    }

    /*const reloadData = () => {
        console.log("soy yo")
        //Evaluamos si tenemos que hacer filtro por extensión del mapa
        let bbox = null;
        if (mapView && qgisLayer.filterByMap) {
          let mapBbox = mapView.getBounds();
          bbox = mapBbox._southWest.lng + "," + mapBbox._southWest.lat + "," + mapBbox._northEast.lng + "," + mapBbox._northEast.lat;
        }
    
        //TODO
        //Evaluamos si tenemos que hacer un filtro por query
        
    
        QgisService.GETCOUNTFEATURES(map, qgisLayer, null, null, qgisLayer.filter, bbox, qgisLayer.sortby)
          .then((data) => {
            setCount(data);
            //Inicializamos los datos virtuales del listado (solo los índices)
            let dataAux = Array.from(
              {
                length: data.numberOfFeatures,
              },
              (_, key) => ({
                key,
              }),
            );
    
            setVirtualData(dataAux);
    
          })
          .catch(err => {
            console.log("ERROR", err);
          });
      }*/

    //metodo que se aplica al mapa pero no a la tabla
    const filter = () => {
        if (!qgisLayer.filter) qgisLayer.filter = "1=1"


        //Borramos el filtro temporal actual, si existiese en la capa
        if (currentFilter) qgisLayer.filter = qgisLayer.filter.replaceAll(currentFilter, "")

        let currentFilterAux = "";
        for (let i in expressions) {
            if (!expressions[i].disabled) {
                let comparator = expressions[i].comparator
                comparator = comparator.replaceAll('field', expressions[i].field).replaceAll('value', expressions[i].value)
                currentFilterAux = currentFilterAux + " AND " + comparator
            }
        }

        setCurrentFilter(currentFilterAux)

        let f = qgisLayer.filter + currentFilterAux


        qgisLayer.filter = f
        qgisLayer.addFilter(f)
        if (mapView) refreshWMSLayer(mapView);
        if (reloadTable) {
            reloadTable()
        }
    }


    return (
        <>
            {<Card
                size="small"
                bordered={true}
                style={{}}>
                <Form
                    layout={"horizontal"}
                    value={{}}
                    disabled={false} // De momento lo pongo siempre como editable... ya veremos como lo dejamos                           
                    form={form}>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "3px" }}>
                        {<Form.Item style={{ marginleft: 'auto', marginRight: "10px" }}>
                            <Row justify={"start"}>
                                <Button ref={botonAddQuery} htmlType="button" onClick={(e) => addExpression()}>
                                    <Space>
                                        <PlusOutlined />
                                        <div className="reader">{i18next.t('common.tools.filter.addExpresion')}</div>
                                    </Space>

                                </Button>
                            </Row>
                        </Form.Item>}

                        {/* BOTON TOOL AYUDA*/}
                        {<Tooltip title={i18next.t('common.tools.help.name')} key={"maphelp"}>
                            <Button size='small' onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                                onClick={(e) => {
                                    setTourOpen(true);
                                }}
                                type={"default"} shape="circle">
                                <QuestionCircleOutlined />
                            </Button>
                        </Tooltip>
                        }
                    </div>


                    <div ref={divExpression}>

                        {fields && expressions && expressions.map((expression, index) => {
                            if (!expression.disabled) {
                                return <>
                                    {/*index>0 && <><div style={{textAlign:"center"}}>AND</div><br /></>*/}
                                    <AttributesFilterComponentExpression key={"AttributesFilterComponentExpression" + index} QGISPRJ={QGISPRJ} map={map} mapView={mapView} qgisLayer={qgisLayer} fields={fields}
                                        expression={expression} deleteExpresaion={deleteExpression} expressionindex={index} expressions={expressions} setExpressions={setExpressions}></AttributesFilterComponentExpression>
                                    <br />
                                </>
                            }
                            else {
                                return <></>
                            }

                        })}
                    </div>
                    {expressions && hasExpressions() && 
                    <Form.Item style={{ marginleft: 'auto' }}>
                        <Row justify={"end"} style={{ paddingTop: "20px" }}>
                            <Space>
                                <Button ref={botonExecute} htmlType="button" onClick={(e) => { filter(); handleCambioQuery(); /*if (setShowDrawerToc) setShowDrawerToc(false); setPopoverFilterVisible(false)*/ }}>
                                    <Space>
                                        <FilterOutlined />
                                        <div className="reader">{i18next.t('common.actions.filter.name')}</div>
                                    </Space>
                                </Button>
                                {/*<Button htmlType="button" onClick={(e) => { setPopoverFilterVisible(false) }}>
                                    <Space>
                                        <CloseCircleOutlined />
                                        <div className="reader">{i18next.t('common.tools.delete_filter.close')}</div>
                                    </Space>
                    </Button>*/}
                            </Space>

                        </Row>
                    </Form.Item>}
                </Form>
            </Card>}
            {/* TOUR CON LA AYUDA */}
            {tourOpen && <Tour open={tourOpen} onClose={() => setTourOpen(false)} steps={getTourSteps()} zIndex={2000}/>}

        </>
    )
};
export default AttributesFilterComponent;


function AttributesFilterComponentExpression({ QGISPRJ, map, mapView, qgisLayer, fields, expression, expressionindex, expressions, setExpressions, deleteExpresaion }) {

    const [fieldName, setFieldName] = useState()
    const [field, setField] = useState()
    const [comparators, setComparators] = useState()
    const [comparator, setComparator] = useState()
    const [inputType, setInputType] = useState() //inputvalue o valuelist
    const [openPopover, setOpenPopover] = useState();
    const [input, setInput] = useState();

    let integerTypes = getIntegerTypes()
    let floatTypes = getFloatTypes()
    let dateTypes = getDateTypes()
    let booleanTypes = getBooleanTypes()

    const fieldIs = (field, types) => {
        let out = false;
        for (let i in types) {
            if (!out && field.typeName.toUpperCase().includes(types[i])) out = true
        }
        return out;
    }

    const hidePopover = () => {
        setOpenPopover(false);
    };

    const inputTypes = [{
        value: "inputvalue",
        label: i18next.t('common.tools.filter.inputTypeInputValue')
    }, {
        value: "valuelist",
        label: i18next.t('common.tools.filter.inputTypeValueList')
    }]

    const setInputValue = (value) => {
        let expressionsCopy = [...expressions]
        expressionsCopy[expressionindex].value = value
        setExpressions(expressionsCopy)
    }

    const getInputs = (c, f, it) => {
        c = c ? c : comparator; //Si no recibe comparator, lo recuperamos del estado
        f = f ? f : field; //Si no recibe field, lo recuperamos del estado
        it = it ? it : inputType
        /*
        if(fieldIs(f, dateTypes) && expressions.value){
            try{
                let d = new Date(expressions.value)
                if(c.includes("<"))d.setHours(23, 59, 59)
                else d.setHours(0, 0, 0)
                setInputValue(d.toISOString())
            }
            catch{}
        }*/

        if (it == "valuelist") {
            setInput(<>TODO</>)
        }
        else {
            setInput(<div style={{ width: "280px" }}><InputFilterComponet QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} map={map} field={f} setValue={setInputValue} /></div>)
            /*
            if(fieldIs(f, dateTypes)){
                setInput(<DatePicker format={'DD/MM/YYYY'} onChange={(e)=>{
                    let d = new Date(e)
                    if(c.includes("<"))d.setHours(23, 59, 59)
                    else d.setHours(0, 0, 0)
                    setInputValue(d.toISOString())
                }}/>)
            }
            else{
                setInput(<Input style={{width: "150px"}} onChange={(e)=>setInputValue(e.target.value)} />)
            }*/
        }


    }

    const getComparators = (f) => {
        f = f ? f : field; //Si no recibe field, lo recuperamos del estado
        let comparatorsCopy = null
        if (inputType == "valuelist") {
            comparatorsCopy = [
                { value: "\"field\" = 'value'", label: i18next.t("common.tools.filter.comparatorEqual") },
                { value: "\"field\" != 'value'", label: i18next.t("common.tools.filter.comparatorNotEqual") }]
        }
        else {
            if (fieldIs(f, integerTypes) || fieldIs(f, floatTypes) || fieldIs(f, dateTypes)) {
                comparatorsCopy = [
                    { value: "\"field\" = 'value'", label: i18next.t("common.tools.filter.comparatorEqual") },
                    { value: "\"field\" != 'value'", label: i18next.t("common.tools.filter.comparatorNotEqual") },
                    { value: "\"field\" > 'value'", label: i18next.t("common.tools.filter.comparatorGreater") },
                    { value: "\"field\" >= 'value'", label: i18next.t("common.tools.filter.comparatorGreaterOrEqual") },
                    { value: "\"field\" < 'value'", label: i18next.t("common.tools.filter.comparatorSmaller") },
                    { value: "\"field\" <= 'value'", label: i18next.t("common.tools.filter.comparatorSmallerOrEqual") },
                    { value: "\"field\" IS NULL OR \"field\" = ''", label: i18next.t("common.tools.filter.comparatorIsEmpty") },
                    { value: "\"field\" IS NOT NULL ANF \"field\" != ''", label: i18next.t("common.tools.filter.comparatorIsNotEmpty") }
                ]
            }
            else if (fieldIs(f, booleanTypes)) {
                comparatorsCopy = [
                    { value: "\"field\" = 'value'", label: i18next.t("common.tools.filter.comparatorEqual") }
                ]
            }
            else {
                comparatorsCopy = [
                    { value: "\"field\" = 'value'", label: i18next.t("common.tools.filter.comparatorEqual") },
                    { value: "\"field\" != 'value'", label: i18next.t("common.tools.filter.comparatorNotEqual") },
                    { value: "\"field\" ILIKE  'value%'", label: i18next.t("common.tools.filter.comparatorStarWith") },
                    { value: "\"field\" ILIKE  '%value'", label: i18next.t("common.tools.filter.comparatorEndsWith") },
                    { value: "\"field\" ILIKE  '%value%'", label: i18next.t("common.tools.filter.comparatorContains") },
                    { value: "\"field\" NOT ILIKE  '%value%'", label: i18next.t("common.tools.filter.comparatorNotContains") },
                    { value: "\"field\" IS NULL OR \"field\" = ''", label: i18next.t("common.tools.filter.comparatorIsEmpty") },
                    { value: "\"field\" IS NOT NULL ANF \"field\" != ''", label: i18next.t("common.tools.filter.comparatorIsNotEmpty") }
                ]
            }
        }
        setComparators(comparatorsCopy)
        selectComnparator(comparatorsCopy[0].value, f)
    }

    const selectComnparator = (c, f) => {
        setComparator(c)

        let expressionsCopy = [...expressions]
        expressionsCopy[expressionindex].comparator = c
        expressionsCopy[expressionindex].value = null
        setExpressions(expressionsCopy)

        getInputs(c, f)
    }

    const selectField = (f) => {
        for (let i in qgisLayer.fields) {
            if (qgisLayer.fields[i].name == f) {
                setField(qgisLayer.fields[i])
                setFieldName(qgisLayer.fields[i].name)
                let expressionsCopy = [...expressions]
                expressionsCopy[expressionindex].field = qgisLayer.fields[i].name
                expressionsCopy[expressionindex].value = null
                setExpressions(expressionsCopy)
                getComparators(qgisLayer.fields[i])
            }
        }
    }

    const renderValueTypePopover = () => {
        return <>
            <Button style={{ width: "100%" }} onClick={() => {
                setInputType("inputvalue")
                hidePopover()
                getComparators()
                getInputs(null, null, "inputvalue")
            }}>
                <Space>
                    <CheckOutlined />
                    <div className="reader">{i18next.t('common.tools.filter.inputTypeInputValue')}</div>
                </Space>
            </Button>
            <Button style={{ width: "100%" }} onClick={() => {
                setInputType("valuelist")
                getComparators()
                hidePopover()
                getInputs()
                getInputs(null, null, "valuelist")
            }}>
                <Space>
                    <CheckOutlined />
                    <div className="reader">{i18next.t('common.tools.filter.inputTypeValueList')}</div>
                </Space>

            </Button>
        </>
    }

    useEffect(() => {
        selectField(fields[0].value)
        setInputType('inputvalue')
    }, [])


    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());


    const renderBrowser = () => {
        return <Space.Compact>


            {fieldName && inputType && <Select
                showSearch
                style={{ width: 150 }}
                placeholder={i18next.t('common.tools.filter.selectField')}
                optionFilterProp="children"
                onChange={(e) => {
                    selectField(e)
                }}
                value={expression.field}
                filterOption={filterOption}
                options={fields}
            />}

            {fieldName && inputType && <Select
                showSearch
                style={{ width: 120 }}
                placeholder={i18next.t('common.tools.filter.selectComparator')}
                optionFilterProp="children"
                onChange={(e) => {
                    selectComnparator(e)
                }}
                value={expression.comparator}
                filterOption={filterOption}
                options={comparators}
            />}

            {input}

            {/*<Select
                            showSearch
                            style={{}}
                            placeholder={i18next.t('common.tools.filter.inputType')}
                            optionFilterProp="children"
                            onChange={(e) => {
                                setInputType(e)
                            }}
                            defaultValue={inputType}
                            filterOption={filterOption}
                            options={inputTypes}
                        />*/}
            {/*TODO DE MOMENTO NO RECUPERO VALLORES ÚNICOS, VER SI SE PUEDE IMPLEMENTAR
            <Tooltip title={i18next.t('common.tools.filter.inputType')}>
                <Popover
                    content={renderValueTypePopover()} placement="bottom"
                    open={openPopover}
                    onOpenChange={handleOpenPopoverChange}
                    title={i18next.t('common.tools.filter.inputType')} trigger="click">
                    <SettingOutlined style={{ paddingLeft: "5px" }} />
                </Popover>
                    </Tooltip>*/}
            <Tooltip title={i18next.t('common.tools.filter.deleteExpresion')}>
                <DeleteOutlined style={{ paddingLeft: "5px" }} onClick={() => deleteExpresaion(expressionindex)} />
            </Tooltip>

        </Space.Compact>
    }

    const renderMobile = () => {
        return <Card
            size="small"
            bordered={true}
            style={{}}>
            {fieldName && inputType && <Select
                showSearch
                style={{ width: "100%" }}
                placeholder={i18next.t('common.tools.filter.selectField')}
                optionFilterProp="children"
                onChange={(e) => {
                    selectField(e)
                }}
                value={expression.field}
                filterOption={filterOption}
                options={fields}
            />}

            {fieldName && inputType && <Select
                showSearch
                style={{ width: "100%" }}
                placeholder={i18next.t('common.tools.filter.selectComparator')}
                optionFilterProp="children"
                onChange={(e) => {
                    selectComnparator(e)
                }}
                value={expression.comparator}
                filterOption={filterOption}
                options={comparators}
            />}

            {input}
            <br />
            <Tooltip title={i18next.t('common.tools.filter.deleteExpresion')}>
                <DeleteOutlined style={{ paddingLeft: "5px" }} onClick={() => deleteExpresaion(expressionindex)} />
            </Tooltip>

        </Card>
    }

    return (
        <>
            <BrowserView>
                {renderBrowser()}
            </BrowserView>
            <MobileView>
                {renderMobile()}
            </MobileView>
        </>
    )
}