import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getDatos } from './utils';
import './fichaIntervencion.css';
import DocumentosAdministrativos from './components/documentosAdministrativos';
import DocumentosMultimedia from './components/documentosMultimedia';
import { ConfigMapContext } from '../context/configMapProvider';
import { Collapse, Pagination } from 'antd';
import BodyFichaPiezaDestacada from './components/bodyFichaPiezaDestacada';
import Header01 from '../components/header01';
import Footer from '../components/footer';

const FichaIntervencion = ({tipo}) => {

    const [datos, setDatos] = useState(false)
    const [page, setPage] = useState();
    const [piezaDestacada, setPiezaDestacada] = useState();
    const { dataPath } = useContext(ConfigMapContext)
    const { layer, id } = useParams()
    const values = [
        "Fotos intervención",
        "Planimetrías",
        "Fotogrametría",
        "Piezas destacadas",
        "Otros",
        "Hemeroteca",
    ]

    const valuesPD = [
        "Foto",
        "Dibujo"
    ]

    let setPageAux = (pageAux) => {
        setPage(pageAux);
        let f = datos.piezasDestacadas[pageAux - 1]
        //console.log(f)
        setPiezaDestacada(f)
    }

    const getDatosProcesador = async (layer, id, dataPath) => {
        let [data] = await Promise.all([getDatos(layer, id, dataPath)])
        return data
    }

    useEffect(() => {
        if (dataPath) {
            getDatosProcesador(layer, id, dataPath).then((data) => {
                setDatos(data)
            })
        }
    }, [dataPath])

    useEffect(() => {
        if (datos) {
            setPageAux(1)
        }
    }, [datos])


    return <>
        {datos &&
            <>
                {<Header01 title={"Ficha de Intervención Arqueológica"} />}
                <div className="fichaIntervencion container">

                    <h3>Datos generales de la intervención</h3>
                    <div className="section">
                        <div className='container-grid'>
                            <p className="data borderDownRight">Nº INTERVENCIÓN: <span>{datos.numero_int}</span></p>
                            <p className="data">DENOMINACIÓN INTERVENCIÓN: <span>{datos.denominacion}</span></p>
                            <p className="data">DIRECCIÓN POSTAL: <span>{datos.direccion}</span></p>
                            <p className="data">TIPOS DE ACTUACIONES: <span>{datos.tipo_actuacion.join(", ")}</span></p>
                            <p className="data">FECHA DE LA ACTUACIÓN: <span>{datos.fecha}</span></p>
                            <p className="data">CONTEXTOS CULTURALES: <span>{datos.context_cult.join(", ")}</span></p>
                            <div>
                                <p className="data">DATOS ADMINISTRATIVOS:</p>
                                <ul className="lista">
                                    <li>Director: {datos.director}</li>
                                    <li>Promotor: {datos.promotor}</li>
                                </ul>
                            </div>
                            <p className="data">LOCALIZAR EN VISOR <a href={'#/mapa?idIntervencion=' + datos.numero_int} target='_blank'>Abrir enlace</a></p>

                        </div>
                    </div>

                    <h3>Datos relativos a los restos</h3>
                    <div className="section">
                        <div>
                            <p className="data">DESCRIPCIÓN DE LOS RESTOS APARECIDOS:</p>
                            {datos.descrip_restos && <Collapse defaultActiveKey={["1"]}
                                items={[{
                                    key: '1', label: 'Descripción', children:
                                        /*<span>{datos.descrip_restos}</span>*/
                                        <p style={{ textAlign: 'justify' }} >
                                            <span dangerouslySetInnerHTML={{ __html: datos.descrip_restos }} />
                                        </p>
                                }]}
                            />}
                        </div>
                        <div>
                            <p className="data">TIPOS DE RESTOS POR FASES CULTURALES:</p>
                            <ul className="lista">
                                {datos.restos.map((resto, index) => (
                                    <li key={index}>
                                        {resto.tipo}: {resto.subtipo} ({resto.fase})
                                        <ul>
                                            <li>
                                                {resto.conservados ?
                                                    `Se conservan restos ${resto.insitu ? 'in situ' : 'no in situ'} ${resto.visibles ? 'y son visibles' : 'y no son visibles'} ${resto.visitables ? 'y son visitables' : 'y no son visitables'}`
                                                    : 'No se conservan restos'}
                                            </li>
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {
                        datos.bibliografia && <>
                            <h3>Bibliografía</h3>
                            <div className="section">
                                <span dangerouslySetInnerHTML={{ __html: datos.bibliografia }} />
                            </div>
                        </>
                    }

                    {datos.doc_admin.length > 0 &&
                        <>
                            <h3>DOCUMENTOS ADMINISTRATIVOS</h3>
                            <div className="section">
                                <DocumentosAdministrativos docs={datos.doc_admin}></DocumentosAdministrativos>
                            </div>
                        </>
                    }

                    {
                        datos.doc_multi.length > 0 && <>
                            <h3>Documentos multimedia</h3>
                            <div className="section">
                                <DocumentosMultimedia docs={datos.doc_multi} values={values} tipo={"intervencion"}></DocumentosMultimedia>
                            </div>
                        </>
                    }
                    {
                        datos.piezasDestacadas.length > 1 &&
                        <>
                            <h3>Piezas destacadas</h3>
                            <div className="section">
                                {datos.piezasDestacadas.length > 1 && <Pagination current={page} defaultCurrent={page} pageSize={1} total={datos.piezasDestacadas.length} onChange={(page) => { setPageAux(page) }} />}
                                {piezaDestacada &&
                                    <BodyFichaPiezaDestacada piezaDestacada={piezaDestacada} intervencion={datos} values={valuesPD} tipo={tipo}></BodyFichaPiezaDestacada>
                                }
                                 {piezaDestacada && piezaDestacada.bibliografia && <>
                                    <h3>Bibliografía</h3>
                                    <div>
                                        <span dangerouslySetInnerHTML={{ __html: piezaDestacada.bibliografia }} />
                                    </div>
                                </>
                                }

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
    </>;
};

export default FichaIntervencion;
