import europa from '../assets/logos/europa.png';
import navarra from '../assets/logos/navarra.png';
import leader from '../assets/logos/leader.png';
import eder from '../assets/logos/eder.png';
import tudela from '../assets/logos/tudela.png';

const Footer = () => {
    return (
        <footer>
            <div className="footer-main">
                <div className="footer-logos">
                    <img src={europa} alt="Europa" />
                    <img src={navarra} alt="Navarra" />
                    <img src={leader} alt="Leader" />
                    <img src={eder} alt="Eder" />
                    <img src={tudela} alt="Tudela" />
                </div>
                
                <div className="credits-section">
                    <h3 className="credits-title">CRÉDITOS</h3>
                    <div className="credits-grid">
                        <div className="credits-column">
                            <h4>Proyecto</h4>
                            <p className="project-title">
                                "Servicio de carta-inventario de intervenciones arqueológicas en el área urbana de la ciudad de Tudela"
                            </p>
                            <p><strong>Promotor:</strong> Ayuntamiento de Tudela</p>
                        </div>
                        
                        <div className="credits-column">
                            <h4>Equipos de Desarrollo</h4>
                            <div className="team-subsection">
                                <p><strong>Equipo técnico arqueológico:</strong></p>
                                <p>Juan José Bienes Calvo (jjbienes@gmail.com)</p>
                                <p>Óscar Sola Torres (oscarsolato@gmail.com)</p>
                                <p><strong>Colaborador:</strong> Mikel Martínez Calvo</p>
                            </div>
                            <div className="team-subsection">
                                <p><strong>Equipo técnico informático:</strong></p>
                                <p>Software Grupo V S.L. –SGV <a href="https://www.sgv.es/" target="_blank" rel="noopener noreferrer">https://www.sgv.es/</a></p>
                            </div>
                        </div>
                        
                        <div className="credits-column">
                            <h4>Derechos de Imagen</h4>
                            <p className="disclaimer-text">
                                "Las imágenes que contiene esta Carta Arqueológica provienen de diferentes fuentes. Para las fotografías propias de excavación, los directores de las mismas. Para las fotografías y dibujos de los materiales, la mayor parte han sido realizadas ex profeso para la Carta al ser inéditas, si bien algunas han sido publicadas. Para aclaraciones y referencias consultar con los realizadores de la Carta Arqueológica."
                            </p>
                        </div>
                    </div>
                </div>

                <style>{`
            footer {
                width: 100%;
                background: linear-gradient(90deg, #a1c4fd, #c2e9fb);
            }
            .footer-main {
                width: 100%;
                padding: 32px 20px 20px 20px;
                color: #fff;
            }
            .footer-logos {
                display: flex;
                gap: 32px;
                align-items: center;
                justify-content: center;
                margin-bottom: 24px;
                flex-wrap: wrap;
            }
            .footer-logos img {
                height: 96px;
                max-width: 240px;
                object-fit: contain;
                border-radius: 4px;
                padding: 4px;
            }
            .credits-section {
                margin-top: 16px;
                padding: 20px;
                border-radius: 8px;
                backdrop-filter: blur(10px);
            }
            .credits-title {
                color: #222;
                font-size: 1.5rem;
                font-weight: bold;
                text-align: center;
                margin-bottom: 20px;
                text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.3);
            }
            .credits-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 30px;
                color: #333;
                font-size: 0.9rem;
                line-height: 1.4;
            }
            .credits-column {
                padding: 0 15px;
            }
            .credits-column h4 {
                color: #222;
                font-size: 1.1rem;
                font-weight: bold;
                margin-bottom: 12px;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
                border-bottom: 2px solid rgba(34, 34, 34, 0.2);
                padding-bottom: 6px;
            }
            .credits-column p {
                margin: 6px 0;
            }
            .project-title {
                font-style: italic;
                margin-bottom: 12px !important;
                color: #222;
                font-weight: 500;
            }
            .team-subsection {
                margin: 12px 0;
            }
            .disclaimer-text {
                font-size: 0.85rem;
                font-style: italic;
                color: #444;
                line-height: 1.3;
            }
            .credits-grid a {
                color: #0066cc;
                text-decoration: none;
                font-weight: 500;
            }
            .credits-grid a:hover {
                text-decoration: underline;
            }
            
            /* Tablets - 2 columnas */
            @media (max-width: 1024px) {
                .footer-main {
                    padding: 24px 16px 16px 16px;
                }
                .footer-logos {
                    gap: 24px;
                    margin-bottom: 20px;
                }
                .footer-logos img {
                    height: 80px;
                    max-width: 200px;
                }
                .credits-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 25px;
                }
                .credits-column:last-child {
                    grid-column: 1 / -1;
                }
            }
            
            /* Móviles - 1 columna */
            @media (max-width: 768px) {
                .footer-main {
                    padding: 16px 12px 12px 12px;
                }
                .footer-logos {
                    gap: 16px;
                    margin-bottom: 16px;
                }
                .footer-logos img {
                    height: 64px;
                    max-width: 140px;
                }
                .credits-section {
                    margin-top: 12px;
                    padding: 16px;
                }
                .credits-title {
                    font-size: 1.2rem;
                    margin-bottom: 16px;
                }
                .credits-grid {
                    grid-template-columns: 1fr;
                    gap: 20px;
                    font-size: 0.85rem;
                }
                .credits-column {
                    padding: 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                    padding-bottom: 15px;
                }
                .credits-column:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }
                .credits-column h4 {
                    font-size: 1rem;
                    margin-bottom: 10px;
                }
                .team-subsection {
                    margin: 8px 0;
                }
                .disclaimer-text {
                    font-size: 0.8rem;
                }
            }
        `}</style>
            </div>
        </footer>
    );
}

export default Footer