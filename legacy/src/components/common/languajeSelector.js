import { Select } from "antd";
import i18next from "i18next";
import { useEffect, useState } from "react"
import { useSelector } from "react-redux";
import { generalParams_state } from "../../features/generalParams/generalParamsSlice";
import { getIdiomas } from "../../utilities/paramsUtils";


function LanguajeSelector({ handleChangeLanguage, setRenderContentFunc, chosenContent }) {
    //https://iconduck.com/sets/flag-icon-set

    const state_params = useSelector(generalParams_state)
    const [options, setOptions] = useState([])

    useEffect(() => {
        if (state_params.length > 0) {
            let { languages } = getIdiomas(state_params)
            //console.log(languages)
            let optionsCopy = []
            languages.forEach(language => {
                let values ={}
                values["value"] = language.language
                values["label"] = <><img style={{ height: "12px" }}
                src={language.src} alt=""></img>
                <small>{language.language.toUpperCase()}</small></>
                optionsCopy.push(values)
            });
            setOptions(optionsCopy)
            //console.log(optionsCopy)
        }
    }, [state_params])

    return (
        <>
            <Select
                defaultValue={i18next.language}
                style={{}}
                onChange={(e) => {
                    handleChangeLanguage(e)
                    
                    setRenderContentFunc(chosenContent)
                }}
                options={options}
            />
        </>
    );
}

export default LanguajeSelector;