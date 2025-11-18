import { createContext, useState, useEffect } from "react";

//Crea el contexto
export const ConfigMapContext = createContext()

//Provee el contexto
export const ConfigMapProvider = ({ children }) => {

    const [config, setConfig] = useState({})
    const [loading, setLoading] = useState(false);
    const [APIKEY, setAPIKEY] = useState(null)
    const [dataPath, setDataPath] = useState(null)


    const getData = async (apikey) => {
        setLoading(true)
        let path = `${CONFIG_PATH}/public`
        if(apikey) {
            path = `${CONFIG_PATH}/private_${apikey}`
        }
        setDataPath(path)
        await fetch(`${path}/AACONFIG.json`)
            .then((response) => response.json())
            .then((data) => { 
                setConfig(data)})
            .catch((error) => console.error("Error al cargar el JSON:", error));
        setLoading(false)
    }

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        // Extract the values of the parameters
        const apikey = params.get('apikey');

        getData(apikey)
    }, [])


    return (
        <ConfigMapContext.Provider value={{ loading, config, setConfig, dataPath }}>
            {children}
        </ConfigMapContext.Provider>
    )
}