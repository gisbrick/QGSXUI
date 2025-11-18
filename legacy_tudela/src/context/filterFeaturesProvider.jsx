import { createContext, useState } from "react";

export const FilterFeatureContext = createContext()

export const FilterFeatureProvider = ({children}) => {

    const [filters, setFilters] = useState({layerName : "", fieldToCheck: "", arrayWithValuesOfExcludedFeatures: []})
    const [filtersOn, setFiltersOn] = useState(false)
    const [searchFilterObject, setSearchFilterObject] = useState({
        "contexto": "",
        "tipo": "",
        "subtipo": "",
        "fase": "",
        "conservados": false,
        "insitu": false,
        "visibles": false,
        "visitables": false

    })

    return (
        <FilterFeatureContext.Provider value={{
            filters,
            setFilters,
            filtersOn,
            setFiltersOn,
            searchFilterObject, 
            setSearchFilterObject
        }}>
            {children}
        </FilterFeatureContext.Provider>
    )

}