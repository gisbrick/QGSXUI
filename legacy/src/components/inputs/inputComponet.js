import { useEffect, useState } from "react";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import dayjs from 'dayjs';
import i18next from "i18next";
import { getLayerFieldByName } from "../../utilities/mapUtils";
import { findDependOnSymbol, getBooleanTypes, getDateTypes, getFloatTypes, getIntegerTypes } from "../../utilities/valueUtils";
import { dependOn, greaterEqualThanValue, greaterThanNow, greaterThanValue, smallerThanNow, smallerThanValue, validCIF, validDNI, validNIE, validateSpanishID } from "../../utilities/validator";
import { useSelector, useDispatch } from "react-redux";
import { features_state, addFeatures, modifiedFeatures } from "../../features/features/featuresSlice";
import { generalParams_state } from "../../features/generalParams/generalParamsSlice";
import { getLetterColorForm, getLetterSizeForm, getLetterTypeForm } from "../../utilities/paramsUtils";
import {
    InputBoolean, InputCheckbox, InputDate, InputDateTime,
    InputExternalResource, InputFloat, InputInteger, InputRange,
    InputRelationReference, InputText, InputValueMap, InputValueRelation
} from "./inputItems";

dayjs.extend(customParseFormat);


const InputComponet = ({ QGISPRJ, map, setFieldsChanged, form, feature, field, properties, qgisLayer, editable }) => {

    const dispatch = useDispatch();
    const featuresState = useSelector(features_state);
    const state_params = useSelector(generalParams_state)

    const [letterSizeForm, setLetterSizeForm] = useState(14)
    const [letterTypeForm, setLetterTypeForm] = useState("Helvetica")
    const [letterColorForm, setLetterColorForm] = useState("#000000")

    const [estadoIncidencia, setEstadoIncidencia] = useState(false)


    const alias = field.alias ? field.alias : field.name;

    let integerTypes = getIntegerTypes()
    let floatTypes = getFloatTypes()
    let dateTypes = getDateTypes()
    let booleanTypes = getBooleanTypes()

    //Inicialiamos propiedades si no las tiene
    if (!properties) properties = {};



    const valueChanged = (value) => {
        //console.log("field", field)
        //console.log("feature", feature)
        //console.log("valoer", value)
        let datos = {
            field,
            feature,
            value
        }
        dispatch(modifiedFeatures(datos))
        properties[field.name] = value;
    }

    const fieldIs = (field, types) => {
        let out = false;
        for (let i in types) {
            if (!out && field.typeName.toUpperCase().includes(types[i])) out = true
        }
        //console.log("id", out)
        return out;
    }


    let getRules = () => {
        let rules = []
        if (!field.readOnly) {
            if (field.constraintNotNull) {
                rules.push({
                    required: true,
                    message: i18next.t('common.msg.form.requiredField', { fieldName: alias }),
                })
            }
            if (field.constraints && field.constraints.constraintExpression != "") {
                rules.push({
                    validator: (rule, value, cb) => {
                        let validator = true;
                        console.log("value", value, field.name)
                        let arrayConstraints = field.constraints.constraintExpression.split(",")
                        if (!value && !field.constraintNotNull) {
                            cb()
                        } else {
                            if (arrayConstraints.find((constraint) => constraint == "'{greaterThan:{now}}'")) {
                                //console.log("RULE " + field.constraints.constraintExpression + " value2", dateToString(new Date()))
                                /*!greaterThanNow(value) ?
                                    cb(i18next.t('common.msg.form.greaterThanNow', { fieldName: alias }))
                                    : cb();*/
                                if (!greaterThanNow(value)) {
                                    cb(i18next.t('common.msg.form.greaterThanNow', { fieldName: alias }))
                                    validator = false
                                }
                            }
                            if (arrayConstraints.find((constraint) => constraint == "'{smallerThan:{now}}'")) {
                                //console.log("RULE " + field.constraints.constraintExpression + " value2", dateToString(new Date()))
                                /*                         !smallerThanNow(value) ?
                                                            cb(i18next.t('common.msg.form.smallerThanNow', { fieldName: alias }))
                                                            : cb(); */
                                if (!smallerThanNow(value)) {
                                    cb(i18next.t('common.msg.form.smallerThanNow', { fieldName: alias }))
                                    validator = false
                                }
                            }
                            if (arrayConstraints.find((constraint) => constraint.startsWith("'{greaterThan:"))) {
                                let constraint = arrayConstraints.find((constraint) => constraint.startsWith("'{greaterThan:"))
                                let comparedFieldName = constraint.replaceAll("'", "").replaceAll("}", "").replaceAll("{", "").split(":")[1].trim()
                                let value2 = comparedFieldName in properties ? properties[comparedFieldName] : null
                                //console.log("RULE " + field.constraints.constraintExpression + " value2", value2)
    
                                let comparedField = getLayerFieldByName(qgisLayer, comparedFieldName)
                                let comparedFieldNameAlias = comparedFieldName
                                if (comparedField && comparedField.alias) comparedFieldNameAlias = comparedField.alias
    
                                if (value2 != null && value != null) {
                                    //console.log("valor2", value2)
                                    /*  !greaterThanValue(value, value2) ?
                                         cb(i18next.t('common.msg.form.greaterThanField', { fieldName: alias, comparedFieldName: comparedFieldNameAlias }))
                                         : cb(); */
                                    if (!greaterThanValue(value, value2)) {
                                        //console.log("actua55")
                                        cb(i18next.t('common.msg.form.greaterThanField', { fieldName: alias, comparedFieldName: comparedFieldNameAlias }))
                                        validator = false
                                    }
                                }
                            }
                            if (arrayConstraints.find((constraint) => constraint.startsWith("'{greaterEqualThan:"))) {
                                let constraint = arrayConstraints.find((constraint) => constraint.startsWith("'{greaterEqualThan:"))
                                let comparedFieldName = constraint.replaceAll("'", "").replaceAll("}", "").replaceAll("{", "").split(":")[1].trim()
                                let value2 = comparedFieldName in properties ? properties[comparedFieldName] : null
                                //console.log("RULE " + field.constraints.constraintExpression + " value2", value2)
    
                                let comparedField = getLayerFieldByName(qgisLayer, comparedFieldName)
                                let comparedFieldNameAlias = comparedFieldName
                                if (comparedField && comparedField.alias) comparedFieldNameAlias = comparedField.alias
    
                                if (value2 != null && value != null) {
                                    //console.log("valor2", value2)
                                    /*  !greaterThanValue(value, value2) ?
                                         cb(i18next.t('common.msg.form.greaterThanField', { fieldName: alias, comparedFieldName: comparedFieldNameAlias }))
                                         : cb(); */
                                    if (!greaterEqualThanValue(value, value2)) {
                                        //console.log("actua greaterEqualThanField")
                                        cb(i18next.t('common.msg.form.greaterEqualThanField', { fieldName: alias, comparedFieldName: comparedFieldNameAlias }))
                                        validator = false
                                    }
                                }
                            }
                            if (arrayConstraints.find((constraint) => constraint.startsWith("'{smallerThan:"))) {
                                let constraint = arrayConstraints.find((constraint) => constraint.startsWith("'{smallerThan:"))
                                let comparedFieldName = constraint.replaceAll("'", "").replaceAll("}", "").replaceAll("{", "").split(":")[1].trim()
                                let value2 = comparedFieldName in properties ? properties[comparedFieldName] : null
                                //console.log("RULE " + field.constraints.constraintExpression + " value2", value2)
                                let comparedField = getLayerFieldByName(qgisLayer, comparedFieldName)
                                let comparedFieldNameAlias = comparedFieldName
                                if (comparedField && comparedField.alias) comparedFieldNameAlias = comparedField.alias
    
                                if (value2 != null && value != null) {
                                    /*                             !smallerThanValue(value, value2) ?
                                                                    cb(i18next.t('common.msg.form.greaterThanField', { fieldName: alias, comparedFieldName: comparedFieldNameAlias }))
                                                                    : cb(); */
                                    if (!smallerThanValue(value, value2)) {
                                        cb(i18next.t('common.msg.form.greaterThanField', { fieldName: alias, comparedFieldName: comparedFieldNameAlias }))
                                        validator = false
                                    }
                                }
                                /*                         else {
                                                            cb()
                                                        } */
                            }
                            if (arrayConstraints.find((constraint) => constraint == "'{DNI}'")) {
                                !validDNI(value) ?
                                    cb(i18next.t('common.msg.form.dniField', { fieldName: alias }))
                                    : cb();
                            }
                            if (arrayConstraints.find((constraint) => constraint == "'{NIE}'")) {
                                !validNIE(value) ?
                                    cb(i18next.t('common.msg.form.nifField', { fieldName: alias }))
                                    : cb();
                            }
                            if (arrayConstraints.find((constraint) => constraint == "'{CIF}'")) {
                                !validCIF(value) ?
                                    cb(i18next.t('common.msg.form.nifField', { fieldName: alias }))
                                    : cb();
                            }
    
                            if (arrayConstraints.find((constraint) => constraint == "'{DNI_NIE_CIF}'")) {
                                !validateSpanishID(value) ?
                                    cb(i18next.t('common.msg.form.dniNieCifField', { fieldName: alias }))
                                    : cb();
                            }
                            if (arrayConstraints.find((constraint) => constraint == "'{ESTADO_INCIDENCIA}'")) {
                                let currentValue = feature.properties[field.name]
                                let newValue = value
                                if (!estadoIncidencia) {
                                    if (newValue < currentValue) {
                                        cb(i18next.t('common.msg.form.statusIncident'))
                                        validator = false
                                    } else {
                                        setEstadoIncidencia(newValue)
                                    }
                                } else {
                                    if (newValue < estadoIncidencia) {
                                        cb(i18next.t('common.msg.form.statusIncident'))
                                        validator = false
                                    } else {
                                        setEstadoIncidencia(newValue)
                                    }
                                }
                            }
                            if (arrayConstraints.find((constraint) => constraint.startsWith("{dependOn:{"))) {
                                let constraint = arrayConstraints.find((constraint) => constraint.includes("{dependOn:"))
                                let comparedFieldNameWithValue = constraint.replaceAll("'", "").replaceAll("}", "").replaceAll("{", "").split(":")[1].trim()
                                let symbolComparison = findDependOnSymbol(comparedFieldNameWithValue)
                                let comparedFieldName = comparedFieldNameWithValue.split(symbolComparison)[0]
    
                                let comparedField = getLayerFieldByName(qgisLayer, comparedFieldName)
                                let comparedFieldNameAlias = comparedFieldName
                                if (comparedField && comparedField.alias) comparedFieldNameAlias = comparedField.alias
                                if (!dependOn(comparedFieldNameWithValue, properties)) {
                                    if (value != null) {
    
                                        cb(i18next.t('common.msg.form.dependOn', { comparedFieldName: comparedFieldNameAlias }))
                                        validator = false
                                    }
                                } else {
                                    if (value == null) {
                                        cb(i18next.t('common.msg.form.requiredField', { fieldName: alias }))
                                        validator = false
                                    }
                                }
                            }
                            if (validator) {
                                cb()
                            }
                        }

                        //console.log("RULE " + field.constraints.constraintExpression + " value1", value)
                        /*if (!value && field.constraintNotNull) {
                            cb(i18next.t('common.msg.form.requiredField', { fieldName: alias }))
                            validator = false
                        }*/

                        if (field.constraints.constraintExpression && field.editorWidgetSetup.type == "ExternalResource") {
                            if (value != null) {
                                //console.log("actua 2")
                                return Promise.resolve();
                            }
                            else {
                                //console.log("actua 3")
                                return Promise.reject(new Error(i18next.t('common.msg.form.requiredField', { 'fieldName': i18next.t('common.actions.media.file') })));
                            }
                        }
                    }
                })
            }
        }

        //Añadir otras

        return rules
    }

    let renderInput = (letterSizeForm, letterTypeForm, letterColorForm) => {
        //dispatch(addFeatures(feature))
        if (field) {
            let config = JSON.parse(field.editorWidgetSetup.config);
            if (field.editorWidgetSetup.type == "Hidden") {
                return <></>
            }
            else if (field.editorWidgetSetup.type == "Range") {
                return <InputRange feature={feature} properties={properties} editable={editable} field={field} alias={alias} qgisLayer={qgisLayer} valueChanged={valueChanged} getRules={getRules} letterSizeForm={letterSizeForm} letterTypeForm={letterTypeForm} letterColorForm={letterColorForm} />
            }
            else if (field.editorWidgetSetup.type == "DateTime") {
                return <InputDateTime setFieldsChanged={setFieldsChanged} form={form} feature={feature} properties={properties} editable={editable} field={field} alias={alias} qgisLayer={qgisLayer} valueChanged={valueChanged} getRules={getRules} letterSizeForm={letterSizeForm} letterTypeForm={letterTypeForm} letterColorForm={letterColorForm} />
            }
            else if (field.editorWidgetSetup.type == "CheckBox") {
                return <InputCheckbox setFieldsChanged={setFieldsChanged} form={form} feature={feature} properties={properties} editable={editable} field={field} alias={alias} qgisLayer={qgisLayer} valueChanged={valueChanged} getRules={getRules} letterSizeForm={letterSizeForm} letterTypeForm={letterTypeForm} letterColorForm={letterColorForm} />
            }
            else if (field.editorWidgetSetup.type == "ExternalResource") {
                return <InputExternalResource map={map} setFieldsChanged={setFieldsChanged} form={form} feature={feature} properties={properties} editable={editable} field={field} alias={alias} qgisLayer={qgisLayer} valueChanged={valueChanged} getRules={getRules} letterSizeForm={letterSizeForm} letterTypeForm={letterTypeForm} letterColorForm={letterColorForm} />
            }
            else if (field.editorWidgetSetup.type == "ValueMap") {
                return <InputValueMap setFieldsChanged={setFieldsChanged} form={form} feature={feature} properties={properties} editable={editable} field={field} alias={alias} qgisLayer={qgisLayer} valueChanged={valueChanged} getRules={getRules} letterSizeForm={letterSizeForm} letterTypeForm={letterTypeForm} letterColorForm={letterColorForm} />
            }
            else if (field.editorWidgetSetup.type == "ValueRelation") {
                return <InputValueRelation map={map} setFieldsChanged={setFieldsChanged} form={form} feature={feature} properties={properties}
                    editable={editable} field={field} alias={alias} qgisLayer={qgisLayer} valueChanged={valueChanged} getRules={getRules}
                    letterSizeForm={letterSizeForm} letterTypeForm={letterTypeForm} letterColorForm={letterColorForm}
                />
            }
            else if (field.editorWidgetSetup.type == "RelationReference") {
                return <InputRelationReference QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={form} feature={feature} properties={properties} editable={editable} field={field} alias={alias} qgisLayer={qgisLayer} valueChanged={valueChanged} getRules={getRules} letterSizeForm={letterSizeForm} letterTypeForm={letterTypeForm} letterColorForm={letterColorForm} />
            }

            //TODO Añadir otros wisgets de input
            else {
                if (fieldIs(field, integerTypes)) {
                    return <InputInteger feature={feature} properties={properties} editable={editable} field={field} alias={alias} qgisLayer={qgisLayer} valueChanged={valueChanged} getRules={getRules} letterSizeForm={letterSizeForm} letterTypeForm={letterTypeForm} letterColorForm={letterColorForm} />
                }
                else if (fieldIs(field, floatTypes)) {
                    return <InputFloat feature={feature} properties={properties} editable={editable} field={field} alias={alias} qgisLayer={qgisLayer} valueChanged={valueChanged} getRules={getRules} letterSizeForm={letterSizeForm} letterTypeForm={letterTypeForm} letterColorForm={letterColorForm} />
                }
                else if (fieldIs(field, dateTypes)) {
                    return <InputDate feature={feature} properties={properties} editable={editable} field={field} alias={alias} qgisLayer={qgisLayer} valueChanged={valueChanged} getRules={getRules} letterSizeForm={letterSizeForm} letterTypeForm={letterTypeForm} letterColorForm={letterColorForm} />
                }
                else if (fieldIs(field, booleanTypes)) {
                    return <InputBoolean feature={feature} properties={properties} editable={editable} field={field} alias={alias} qgisLayer={qgisLayer} valueChanged={valueChanged} getRules={getRules} letterSizeForm={letterSizeForm} letterTypeForm={letterTypeForm} letterColorForm={letterColorForm} />
                }

                //TODO Añadir otros tipos de input
                else {
                    return <InputText feature={feature} properties={properties} editable={editable} field={field} alias={alias} qgisLayer={qgisLayer} valueChanged={valueChanged} getRules={getRules} letterSizeForm={letterSizeForm} letterTypeForm={letterTypeForm} letterColorForm={letterColorForm} />
                }

            }
        }
        else {
            return <></>
        }

    }

    useEffect(() => {
        if (feature.id) {
            dispatch(addFeatures(feature))
        }
    }, [feature])

    useEffect(() => {
        if (state_params.length > 0) {

            let letterSizeForm = getLetterSizeForm(state_params)

            if (letterSizeForm) {
                setLetterSizeForm(letterSizeForm)
            }

            let letterTypeForm = getLetterTypeForm(state_params)

            if (letterTypeForm) {
                setLetterTypeForm(letterTypeForm)
            }

            let letterColorForm = getLetterColorForm(state_params)

            if (letterColorForm) {
                setLetterColorForm(letterColorForm)
            }

        }

    }, [state_params])

    return (
        <div style={{ padding: "5px" }}>
            {renderInput(letterSizeForm, letterTypeForm, letterColorForm)}
        </div>

    )
};

export default InputComponet;














