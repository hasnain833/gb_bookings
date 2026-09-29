import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { AppErrorBoundary } from './app/AppErrorBoundary.tsx';
import './index.css';
import { LanguageProvider } from './app/LanguageContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
