import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MapViewProvider } from './context/mapViewProvider.jsx'
import { ConfigMapProvider } from './context/configMapProvider.jsx'

createRoot(document.getElementById('root_arqueo_tudela')).render(
  <StrictMode>
    <ConfigMapProvider>
      <MapViewProvider>
        <App />
      </MapViewProvider>
    </ConfigMapProvider>
  </StrictMode>
)
