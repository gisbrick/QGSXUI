

const Header01 = ({ title }) => {
    return (
      <>
    <div className="header-container">
        <div className="header-title">{title}</div>
        <style>{`
            .header-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                padding: 32px 20px 20px 20px;
                background: linear-gradient(90deg, #a1c4fd, #c2e9fb);
                color: #fff;
            }
            .header-logos {
                display: flex;
                gap: 32px;
                align-items: center;
                justify-content: center;
                margin-bottom: 24px;
                flex-wrap: wrap;
            }
            .header-logos img {
                height: 96px;
                max-width: 240px;
                object-fit: contain;
                border-radius: 4px;
                padding: 4px;
            }
            .header-title {
                padding: 16px 24px;
                font-size: 2rem;
                font-weight: bold;
                color: #222;
                text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
                text-align: center;
            }
            @media (max-width: 1200px) {
                .header-container {
                    padding: 16px 8px 12px 8px;
                }
                .header-logos {
                    gap: 16px;
                    margin-bottom: 16px;
                }
                .header-logos img {
                    height: 72px;
                    max-width: 160px;
                }
                .header-title {
                    font-size: 1.3rem;
                    margin: 12px 0;
                }
            }
        `}</style>
    </div>
      </>
    );
};

export default Header01;
