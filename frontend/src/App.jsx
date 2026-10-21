import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { LocationProvider } from './context/LocationContext';
import AppRoutes from './routes/AppRoutes';
import './i18n'; // Initialize multilingual localizations
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <LanguageProvider>
            <AppRoutes />
          </LanguageProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
