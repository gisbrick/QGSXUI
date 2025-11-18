import { Collapse } from "antd";
import DocumentosMultimedia from "./documentosMultimedia";

const BodyFichaPiezaDestacada = ({ piezaDestacada, intervencion, values, tipo }) => {

    let urlPiez3DEmbebida = null;

    if(piezaDestacada.enlace_3D) {
        const match = piezaDestacada.enlace_3D.match(/\/3d-models\/.*-(\w+)$/);
        if (match && match[1]) {
            urlPiez3DEmbebida = `https://sketchfab.com/models/${match[1]}/embed`;
        }
    }
        //https://sketchfab.com/3d-models/cuenco-carenado-ceramica-bajomedieval-3427a81d223940b7ba8380b36e1f6d76
    
    return (
        <>
            <div className='container-grid'>
                <p className="data borderDownRight">Nº PIEZA: <span>{piezaDestacada.num_pieza}</span></p>
                <p className="data">INTERVENCIÓN: <span>{intervencion.denominacion}</span></p>
                <p className="data">SIGLA: <span>{piezaDestacada.sigla}</span></p>
                <p className="data">MORFOLOGÍA: <span>{piezaDestacada.morfologia}</span></p>
                <p className="data">OBJETO: <span>{piezaDestacada.objeto}</span></p>
                <p className="data">CRONOLOGÍA: <span>{piezaDestacada.cronologia}</span></p>
                <p className="data">PRODUCCIÓN: <span>{piezaDestacada.produccion}</span></p>
                <p className="data">DIMENSIONES: <span>{piezaDestacada.dimensiones}</span></p>
                {piezaDestacada.enlace_3D && 
                <p className="data">MODELO 3D <a href={piezaDestacada.enlace_3D} target='_blank'>Abrir enlace</a></p>}

                {tipo=="intervencion" && <p className="data">FICHA DE INTERVENCIÓN <a href={'#/ficha/intervenciones/' + intervencion.numero_int} target='_blank'>Abrir enlace</a></p>}
                {tipo=="pieza" && <p className="data">FICHA DE PIEZA <a href={'#/fichaPiezaDestacada/' + piezaDestacada.num_pieza} target='_blank'>Abrir enlace</a></p>}
                <p className="data">LOCALIZAR EN VISOR <a href={'#/mapa?idIntervencion=' + intervencion.numero_int} target='_blank'>Abrir enlace</a></p>

              
            </div>

            
            {piezaDestacada.enlace_3D && urlPiez3DEmbebida && <>
                <div class="sketchfab-embed-wrapper" style={{ width: '100%', height: '400px' }}>
                    <iframe title="Cuenco carenado. Cerámica bajomedieval." style={{ width: '100%', height: '100%' }}
                        frameborder="0"
                        allowfullscreen mozallowfullscreen="true"
                        webkitallowfullscreen="true"
                        allow="autoplay; fullscreen; xr-spatial-tracking"
                        xr-spatial-tracking execution-while-out-of-viewport
                        execution-while-not-rendered web-share
                        src={urlPiez3DEmbebida}>
                    </iframe>
                </div>
                <br />
            </>
            }

            <div className='collapse'>
                {<Collapse defaultActiveKey={["1"]}
                    items={[{
                        key: '1', label: 'Descripción', children:
                            <span>{piezaDestacada.descripcion}</span>
                    }]}
                />}
            </div>
            <div className='collapse'>
                {<Collapse defaultActiveKey={["1"]}
                    items={[{
                        key: '1', label: 'Decoración', children:
                            <span>{piezaDestacada.decoracion}</span>
                    }]}
                />}
            </div>
            <div>
                <DocumentosMultimedia docs={piezaDestacada.media} values={values} tipo={"pieza"}></DocumentosMultimedia>
            </div>
        </>
    )
}

export default BodyFichaPiezaDestacada;