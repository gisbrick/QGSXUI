
const Header = ({title}) => {
    return (
        <div className="map-top-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#001529', color: '#fff' }}>
            <div className="app-name" style={{ fontWeight: 'bold' }}>
                <span style={{ fontSize: '30px' }}>{title}</span>
            </div>
            <div className="app-logo">
                <img src="./logo.png" alt="App Logo" style={{ height: '70px' }} />
            </div>
        </div>
    )
}

export default Header