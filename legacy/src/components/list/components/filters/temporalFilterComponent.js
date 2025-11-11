import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { CaretDownOutlined, CloseCircleOutlined, DeleteOutlined, FilterOutlined } from "@ant-design/icons";
import { Button, Card, DatePicker, Form, Input, Row, Space, Tabs, Tooltip } from "antd";
import { Content } from "antd/es/layout/layout";
import i18next from "i18next";
import { refreshWMSLayer } from "../../../../utilities/mapUtils";
import { Reactor } from "../../../../utilities/EventsUtilities";


function TemporalFilterComponent({ map, mapView, qgisLayer }) {
    return (
        <>
            {qgisLayer.temporalProperties.mode == "2" &&
                <TemporalFilterComponentFromFieldToField mapView={mapView} map={map} qgisLayer={qgisLayer} />}

            {<TemporalFilterComponentFromFieldToDuration mapView={mapView} map={map} qgisLayer={qgisLayer} />}

        </>
    )
};
export default TemporalFilterComponent;

function TemporalFilterComponentFromFieldToField({ map, mapView, qgisLayer }) {

    const [form] = Form.useForm();
    const [currentDateFilter, setCurrentDateFilter] = useState()


    useEffect(() => {

    }, [])

    useEffect(() => {
        if (qgisLayer.filter == null) {
            form.setFieldsValue({});
            form.resetFields()
        }
    }, [qgisLayer.filter])

    let startField = null;
    let endField = null;

    for (let i in qgisLayer.fields) {
        if (qgisLayer.fields[i].name == qgisLayer.temporalProperties.startField) startField = qgisLayer.fields[i];
        if (qgisLayer.fields[i].name == qgisLayer.temporalProperties.endField) endField = qgisLayer.fields[i];
    }

    let startFieldAlias = startField ? startField.alias ? startField.alias : startField.name : "";
    let endFieldAlias = endField ? endField.alias ? endField.alias : endField.name : "";


    const filter = () => {
        form.validateFields().then(async (value) => {
            let vFrom = new Date(value.from)
            vFrom.setHours(0, 0, 0);
            let vTo = new Date(value.to)
            vTo.setHours(23, 59, 59);

            if (!qgisLayer.filter) qgisLayer.filter = "1=1"

            //Borramos el filtro temporal actual, si existiese en la capa
            if (currentDateFilter) qgisLayer.filter = qgisLayer.filter.replaceAll(currentDateFilter, "")
            let currentDateFilterAux = " AND \"" + qgisLayer.temporalProperties.startField + "\" > '" + vFrom.toISOString() + "'" +
                " AND \"" + qgisLayer.temporalProperties.endField + "\" < '" + vTo.toISOString() + "'"
            setCurrentDateFilter(currentDateFilterAux)

            let f = qgisLayer.filter + currentDateFilterAux

            qgisLayer.filter = f
            qgisLayer.addFilter(f)
            if (mapView) refreshWMSLayer(mapView);
        })
    }

    return (<>

        {<Card
            size="small"
            bordered={true}
            style={{}}>
            <Form
                layout={"horizontal"}
                value={{}}
                disabled={false} // De momento lo pongo siempre como editable... ya veremos como lo dejamos                           
                form={form}>

                <Form.Item label={<div className="reader">{startFieldAlias}</div>}
                    name="from"
                    rules={[
                        {
                            required: true,
                            message: i18next.t('common.tools.temporal_filter.from_required'),
                        },
                    ]}>
                    <DatePicker format={'DD/MM/YYYY'} />
                </Form.Item>

                <Form.Item label={<div className="reader">{endFieldAlias}</div>}
                    name="to"
                    rules={[
                        {
                            required: true,
                            message: i18next.t('common.tools.temporal_filter.to_required'),
                        },
                    ]}>
                    <DatePicker format={'DD/MM/YYYY'} />
                </Form.Item>

                {<Form.Item style={{ marginleft: 'auto' }}>
                    <Row justify={"end"}>
                        <Button htmlType="button" onClick={(e) => filter()}>
                            <Space>
                            <FilterOutlined />
                            <div className="reader">{i18next.t('common.actions.filter.name')}</div>
                            </Space>

                        </Button>
                    </Row>
                </Form.Item>}
            </Form>
        </Card>}
    </>)
}

function TemporalFilterComponentFromFieldToDuration({ map, mapView, qgisLayer }) {

    return (<>{qgisLayer.temporalProperties.mode == "3" &&
        <TemporalFilterComponentFromFieldToDurationField mapView={mapView} map={map} qgisLayer={qgisLayer} />}
        {qgisLayer.temporalProperties.mode == "1" &&
            <TemporalFilterComponentFromFieldToDurationFixed mapView={mapView} map={map} qgisLayer={qgisLayer} />}</>)
}


function TemporalFilterComponentFromFieldToDurationField({ map, mapView, qgisLayer }) {

    return (<>
        filter type not supported yet
    </>)
}

function TemporalFilterComponentFromFieldToDurationFixed({ map, mapView, qgisLayer }) {

    const [form] = Form.useForm();
    const [currentDateFilter, setCurrentDateFilter] = useState()
    const [value, setValue] = useState()

    useEffect(() => {
        setValue({});
    }, [])

    useEffect(() => {
        if (qgisLayer.filter == null) {
            setValue({});
            form.setFieldsValue({});
        }
    }, [qgisLayer.filter])

    const filter = () => {
        form.validateFields().then(async (value) => {

            let vFrom = new Date(value.from)
            vFrom.setHours(0, 0, 0);

            let vTo = new Date(value.from);
            vTo.setHours(0, 0, 0);
            vTo = addDuration(vTo, qgisLayer.temporalProperties.fixedDuration, qgisLayer.temporalProperties.durationUnits)

            if (!qgisLayer.filter) qgisLayer.filter = "1=1"

            //Borramos el filtro temporal actual, si existiese en la capa
            if (currentDateFilter) qgisLayer.filter = qgisLayer.filter.replaceAll(currentDateFilter, "")

            let currentDateFilterAux = " AND \"" + qgisLayer.temporalProperties.startField + "\" > '" + vFrom.toISOString() + "'" +
                " AND \"" + qgisLayer.temporalProperties.startField + "\" < '" + vTo.toISOString() + "'"
            setCurrentDateFilter(currentDateFilterAux)

            let f = qgisLayer.filter + currentDateFilterAux

            qgisLayer.filter = f
            qgisLayer.addFilter(f)
            if (mapView) refreshWMSLayer(mapView);
        })
    }


    return (<>
        {value && <Card
            size="small"
            bordered={true}
            style={value}>
            <Form
                layout={"horizontal"}
                value={value}
                disabled={false} // De momento lo pongo siempre como editable... ya veremos como lo dejamos                           
                form={form}>

                <Form.Item label={<div className="reader">{i18next.t('common.tools.temporal_filter.from')}</div>}
                    name="from"
                    rules={[
                        {
                            required: true,
                            message: i18next.t('common.tools.temporal_filter.from_required'),
                        },
                    ]}>
                    <DatePicker value={value.from} format={'DD/MM/YYYY'} />
                </Form.Item>

                <Form.Item label={<div className="reader">{i18next.t('common.tools.temporal_filter.duration')}</div>}>
                    <Input style={{ width: "150px" }} value={qgisLayer.temporalProperties.fixedDuration} disabled={true} addonAfter={getUnitsLabel(qgisLayer.temporalProperties.durationUnits)} />
                </Form.Item>

                {<Form.Item style={{ marginleft: 'auto' }}>
                    <Row justify={"end"}>
                        <Button htmlType="button" onClick={(e) => filter()}>
                            <Space>
                            <FilterOutlined />
                            <div className="reader">{i18next.t('common.actions.filter.name')}</div>
                            </Space>
                        </Button>
                    </Row>
                </Form.Item>}
            </Form>
        </Card>}
    </>)
}

function addDuration(date, duration, units) {

    if (units == 0) {
        date.setMilliseconds(date.getMilliseconds() + duration);
    }
    else if (units == 1) {
        date.setSeconds(date.getSeconds() + duration);
    }
    else if (units == 2) {
        date.addDays(date.getMinutes() + duration);
    }
    else if (units == 3) {
        date.setHours(date.getHours() + duration);
    }
    else if (units == 4) {
        date.setDate(date.getDate() + duration);
    }
    else if (units == 5) {
        date.setDate(date.getDate() + (duration * 7));
    }
    else if (units == 6) {
        date.setMonth(date.getMonth() + duration);
    }
    else if (units == 7) {
        date.setYear(date.getYear() + duration);
    }
    else if (units == 8) {
        date.setYear(date.getYear() + (duration * 10));
    }
    else if (units == 0) {
        date.setYear(date.getYear() + (duration * 100));
    };
    return date;
}

function getUnitsLabel(units) {

    if (units == 0) {
        return i18next.t('common.tools.temporal_filter.milliseconds')
    }
    else if (units == 1) {
        return i18next.t('common.tools.temporal_filter.seconds')
    }
    else if (units == 2) {
        return i18next.t('common.tools.temporal_filter.minutes')
    }
    else if (units == 3) {
        return i18next.t('common.tools.temporal_filter.hours')
    }
    else if (units == 4) {
        return i18next.t('common.tools.temporal_filter.days')
    }
    else if (units == 5) {
        return i18next.t('common.tools.temporal_filter.weeks')
    }
    else if (units == 6) {
        return i18next.t('common.tools.temporal_filter.months')
    }
    else if (units == 7) {
        return i18next.t('common.tools.temporal_filter.years')
    }
    else if (units == 8) {
        return i18next.t('common.tools.temporal_filter.decades')
    }
    else if (units == 0) {
        return i18next.t('common.tools.temporal_filter.denturies')
    }
}