import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import PwaAvisos from './componentes/pwa/PwaAvisos';
import { obtenerTemaInicial } from './hooks/useTema';
import './estilos/base.css';
import './estilos/componentes.css';
import './estilos/lienzo.css';
import './estilos/despiece.css';
import './estilos/piezas.css';
import './estilos/marketing.css';
import './estilos/pwa.css';

document.documentElement.dataset.tema = obtenerTemaInicial();

ReactDOM.createRoot(document.getElementById('raiz')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <PwaAvisos />
    </BrowserRouter>
  </React.StrictMode>,
);
