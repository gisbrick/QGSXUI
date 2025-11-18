import React from 'react';
import europa from '../assets/logos/europa.png';
import navarra from '../assets/logos/navarra.png';
import leader from '../assets/logos/leader.png';
import eder from '../assets/logos/eder.png';
import tudela from '../assets/logos/tudela.png';
import {
    HomeFilled
} from "@ant-design/icons";
import { Space } from 'antd';

const Header02 = ({ title }) => {
    return (
        <>
            <div className="header-container">
                <div className="header-title">
                    <Space>
                        <a style={{ color: "black" }} href='/visor'>
                            <HomeFilled />
                        </a>
                        {title}
                    </Space>
                </div>
                <div className="header-logos">
                    <img src={europa} alt="Europa" />
                    <img src={navarra} alt="Navarra" />
                    <img src={leader} alt="Leader" />
                    <img src={eder} alt="Eder" />
                    <img src={tudela} alt="Tudela" />
                </div>
                <style>{`
            .header-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px;
                background: linear-gradient(90deg, #a1c4fd, #c2e9fb);
                color: #fff; 
            }
            .header-title {
                padding: 16px 24px;
                font-size: 1.5rem;
                font-weight: bold;
                color: #222;
                text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
                text-align: left;
            }
            .header-logos {
                display: flex;
                gap: 16px;
                align-items: center;
                flex-shrink: 0;
            }
            .header-logos img {
                height: 64px;
                max-width: 180px;
                object-fit: contain;
                border-radius: 4px;
            }
            /* Cambia a móvil a 1200px  */
            @media (max-width: 1200px) {
                .header-container {
                    flex-direction: column;
                    align-items: stretch;
                    padding: 12px 8px;
                }
                .header-logos {
                    justify-content: center;
                    margin-bottom: 8px;
                    gap: 10px;
                }
                .header-title {
                    text-align: center !important;
                    font-size: 1.3rem;
                    margin: 16px 0;
                }
                .header-logos img {
                    height: 48px;
                    max-width: 120px;
                }
            }
            /* Más pequeño para móviles reales */
            @media (max-width: 600px) {
                .header-logos img {
                    height: 32px;
                    max-width: 70px;
                }
            }
        `}</style>
            </div>
        </>
    );
};

export default Header02;
