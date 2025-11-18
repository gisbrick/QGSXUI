import Header01 from '../header01';
import Footer from '../footer';
import { Link } from 'react-router';

const ArqueoIndex = () => {
    return (
        <>
         {<Header01 title={"Carta Arqueológica de Tudela: Un proyecto de herramienta digital"}/>}

        <div style={{ margin: '32px' }}>
            <div style={{ border: '2px solid #ccc', borderRadius: '12px', padding: '24px', marginBottom: '32px', background: '#fafafa' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '1em' }}>
                    La Carta Arqueológica de Tudela es un inventario digital que permite explorar el patrimonio arqueológico descubierto en la ciudad desde la década de 1980. Después de más de cuarenta años de intervenciones, se hace indispensable catalogar y contextualizar estos hallazgos. <br /><br />
                    Para ello, se ha desarrollado una herramienta digital que servirá como instrumento para el conocimiento y difusión del rico y variado patrimonio arqueológico de Tudela.
                </p>
                <p style={{ color: '#b00', fontWeight: 'bold' }}>
                    Actuación cofinanciada por el Fondo de Desarrollo Rural de la Unión Europea (FEADER) en un 45% y por el Gobierno de Navarra en un 55%, en el marco de la Estrategia de Desarrollo Rural LEADER-PEPAC en Navarra 2023-2027 (Submedida 7119. 02.01).
                </p>
            </div>
            <h1 style={{ fontSize: '2.5rem' }}>Contenido:</h1>
          
            <ul style={{ fontSize: '1.25rem' }}>
                <li>
                    1.- VISOR - Sistema de información geográfica de las intervenciones arqueológicas de Tudela y de las Fichas Descriptivas de las intervenciones. <a href="./#/mapa">(enlace visor)</a>                   
                </li>
                <li>
                    2.- Catálogo-inventario de los materiales más destacados en descripción y documentación gráfica. <a href="./#/catalogoPiezas">(enlace catálogo piezas)</a>
                </li>
                <li>
                    3.- Museo Virtual en tres dimensiones de las piezas-restos más destacados. <a href="./#/museoVirtual">(enlace Museo)</a> 
                </li>
            </ul>
        </div>

        {<Footer></Footer>}
        </>
    );
};

export default ArqueoIndex;