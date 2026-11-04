import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import { AppErrorBoundary } from './app/AppErrorBoundary.tsx';
import './index.css';
import { LanguageProvider } from './app/LanguageContext.tsx';
import Toaster from './shared/components/Toaster.tsx';
import FormValidation from './shared/components/FormValidation.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <LanguageProvider>
        <App />
        <Toaster />
        <FormValidation />
      </LanguageProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
