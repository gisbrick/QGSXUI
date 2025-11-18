import { useContext, useEffect, useState } from "react";
import { ConfigMapContext } from "../../context/configMapProvider";
import { Card, Col, Image, Row } from "antd";
import { Select } from "antd";

const ElementosCatalogo = () => {

    const { dataPath } = useContext(ConfigMapContext)
    const [dataPiezasOrigen, setDataPiezasOrigen] = useState([])
    const [dataPiezas, setDataPiezas] = useState([])
    const [dataCronologia, setDataCronologia] = useState([])
    const [selectedCronologia, setSelectedCronologia] = useState("")

    const cronología = "Cronología de piezas destacadas.geojson"
    const mediaPiezasDestacadas = "Media piezas destacadas.geojson"
    const piezasDestacadasLayerName = "Piezas destacadas.geojson"

    const getCronología = async () => {
        const response = await fetch(`${dataPath}/${cronología}`);
        const geojsonData = await response.json();
        return geojsonData;
    }

    const getPiezasDestacadas = async () => {
        const response = await fetch(`${dataPath}/${piezasDestacadasLayerName}`);
        const geojsonData = await response.json();
        return geojsonData;
    }

    const getMediaPiezasDestacadas = async () => {
        const response = await fetch(`${dataPath}/${mediaPiezasDestacadas}`);
        const geojsonData = await response.json();
        return geojsonData;
    }

    const mount = async () => {
        await Promise.all([getPiezasDestacadas(), getMediaPiezasDestacadas(), getCronología()])
            .then((values) => {
                //console.log(values)
                const piezasDestacadas = values[0]
                const media = values[1]
                const cronologia = values[2]
                setDataCronologia(cronologia.features);
                const arrayGlobal = []
                if (piezasDestacadas.features.length > 0) {
                    const array = piezasDestacadas.features.map((item) => {
                        //console.log(media.features)
                        const mediaItemUrl = media.features.find((mediaItem) => mediaItem.properties.num_pieza == item.properties.num_pieza && mediaItem.properties.tipo == "Foto")?.properties.url

                        item.properties.url = mediaItemUrl

                        return item.properties
                    })
                    arrayGlobal.push(...array)
                }

                setDataPiezas(arrayGlobal)
                setDataPiezasOrigen(arrayGlobal)
            })
            .catch((error) => console.log("error", error))
    }

    useEffect(() => {
        if (dataPath) {
            mount()
        }
    }, [dataPath])

    return (
        <>
            <div style={{ marginBottom: 16 }}>
                <label htmlFor="cronologia-filter" style={{ marginRight: 8 }}>Filtrar por cronología de la pieza:</label>
              
                <Select
                    if="cronologia-filter"
                    style={{ width: 250, marginRight: 16 }}
                    allowClear
                    placeholder="Selecciona cronología"
                    value={selectedCronologia || undefined}
                    onChange={value => {
                        setSelectedCronologia(value || "");
                        const filteredPiezas = dataPiezasOrigen.filter(item => {
                            return !value || item.cronologia === value;
                        });
                        setDataPiezas(filteredPiezas);
                    }}
                    options={[
                        { value: "", label: "Ver todas" },
                        ...(Array.isArray(dataCronologia)
                            ? dataCronologia.map(item => ({
                                value: item.properties.cod_crono,
                                label: item.properties.nom_crono
                            }))
                            : [])
                    ]}
                />
            </div>
            {
                dataPiezas.filter(item => item.url).length > 0 ? (
                    <Row gutter={[16, 16]}>
                        {dataPiezas
                            .filter(item => item.url)
                            .map((item, index) => (
                                <Col key={index} xs={24} sm={12} md={8} lg={6}>
                                    <Card
                                        title={
                                            <span
                                                style={{ cursor: "pointer" }}
                                                onClick={() => window.open(`#/fichaPiezaDestacada/${item.num_pieza}`, "_blank")}
                                            >
                                                {item.morfologia}
                                            </span>
                                        }
                                        headStyle={{ background: "#c2e9fb" }}
                                    >
                                        <div>
                                            <Image
                                                preview={false}
                                                style={{ textAlign: "center", cursor: "pointer" }}
                                                onClick={() => {
                                                    window.open(`#/fichaPiezaDestacada/${item.num_pieza}`, "_blank")
                                                }}
                                                crossOrigin="anonymous"
                                                src={item.url}
                                                placeholder={<div style={{ textAlign: "center", width: "100%" }}>Cargando...</div>}
                                            />
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                    </Row>
                ) : (
                    <div>No hay datos</div>
                )
            }
        </>
    );
}

export default ElementosCatalogo