import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { useThemeSync } from './components/ThemeProvider';
import { InstallBanner } from './components/InstallBanner';
import { MotionGuard } from './components/MotionGuard';
import './styles/index.css';

function Root() {
  useThemeSync();
  return (
    <MotionGuard>
      <App />
      <InstallBanner />
    </MotionGuard>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>,
);
