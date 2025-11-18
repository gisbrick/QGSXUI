import { useParams } from "react-router";
import { getDatos } from "./utils";
import { useContext, useEffect, useState } from "react";
import { ConfigMapContext } from "../context/configMapProvider";
import BodyFichaPiezaDestacada from "./components/bodyFichaPiezaDestacada";
import Header02 from "../components/header02";
import Header01 from "../components/header01";
import Footer from "../components/footer";

const FichaPiezaDestacada = ({tipo}) => {

    const { dataPath } = useContext(ConfigMapContext)
    const { id } = useParams()
    const [data, setData] = useState(false)

    const valuesPD = [
        "Foto",
        "Dibujo"
    ]

    const getDatosProcesador = async (layer, id, dataPath) => {
        let [data] = await Promise.all([getDatos(layer, id, dataPath)])
        return data
    }

    useEffect(() => {
        if (dataPath) {
            getDatosProcesador("piezas_destacadas", id, dataPath).then((data) => {
                setData(data)
            })
        }
    }, [dataPath])

    return (
        <>
            {
                data &&
                <>
                    <Header01 title={"Ficha de Pieza Destacada"}></Header01>
                    <div className=" fichaIntervencion container">
                        {/* <div className='header'>
                        <h2>Ficha de Pieza Destacada</h2>
                        <img src='./logo.png' alt='imagen'></img>
                    </div>*/}
                        <h3>Datos generales de la pieza</h3>
                        <div className="section">
                            <BodyFichaPiezaDestacada piezaDestacada={data} intervencion={data.intervencion} values={valuesPD} tipo={tipo}></BodyFichaPiezaDestacada>
                        </div>

                        {
                            data.bibliografia && <>
                                <h3>Bibliografía</h3>
                                <div className="section">
                                    <span dangerouslySetInnerHTML={{ __html: data.bibliografia }} />
                                </div>
                            </>
                            }

                    </div>
                    {<Footer></Footer>}
                </>

            }
            <style>{`
            .header-responsive {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                padding: 1rem 0;
            }
            .header-responsive img.logo-img {
                max-width: 100px;
                height: auto;
            }
            @media (max-width: 600px) {
                .header-responsive {
                    flex-direction: column;
                    align-items: flex-start;
                    text-align: left;
                    gap: 0.5rem;
                }
                .header-responsive h2 {
                    font-size: 1.2rem;
                }
                .header-responsive img.logo-img {
                    max-width: 40px;
                    height: auto;
                }
            }
        `}</style>
        </>
    )
}

export default FichaPiezaDestacada;