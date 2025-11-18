import './App.css'
import Map from './components/map/map'
import { ConfigProvider } from 'antd'
import locale_es from 'antd/locale/es_ES';
import { Routes, Route, HashRouter } from 'react-router';
import FichaIntervencion from './ficha/fichaIntervencion';
import FichaPiezaDestacada from './ficha/fichaPiezaDestacada';
import MuseoVirtual from './components/museoVirtual/museoVirtual';
import ArqueoIndex from './components/index/arqueo';
import CatalogoPiezas from './components/catalogoPiezas/catalogoPiezas';

function App() {

  let myTheme = {
    "token": {
      "colorPrimary": "#0093d7",
      "algorithm": true,
      "fontFamily:": "Helvetica,Arial, sans-serif",
    }
  }

  // Render the main application UI
  return (
    <>
      <ConfigProvider locale={locale_es} theme={myTheme}>
        <HashRouter>
          <Routes>
            <Route index element={<ArqueoIndex />} />
            <Route path="/mapa/" index element={<Map />} />
            <Route path="/museoVirtual" element={<MuseoVirtual />} />
            <Route path='/catalogoPiezas' element={<CatalogoPiezas />} />
            <Route path="/ficha/:layer/:id" element={<FichaIntervencion tipo={"pieza"} />} />
            <Route path="/fichaPiezaDestacada/:id" element={<FichaPiezaDestacada tipo={"intervencion"} />} />
          </Routes>
        </HashRouter>
      </ConfigProvider>
    </>
  )
}

export default App
