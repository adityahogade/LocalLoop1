import React, { createContext, useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { customerApi } from '../api/customer';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [language, setLanguageState] = useState(i18n.language || 'en');

  useEffect(() => {
    const handleLangChange = (lng) => {
      setLanguageState(lng);
      localStorage.setItem('i18nextLng', lng);
    };
    i18n.on('languageChanged', handleLangChange);
    return () => {
      i18n.off('languageChanged', handleLangChange);
    };
  }, [i18n]);

  const changeLanguage = async (lng) => {
    await i18n.changeLanguage(lng);
    setLanguageState(lng);
    localStorage.setItem('i18nextLng', lng);

    // Sync with backend if logged-in user is a customer
    if (user && user.role === 'customer') {
      try {
        await customerApi.updateMyProfile({ preferred_language: lng });
      } catch (err) {
        console.error('Failed to sync language preference with backend:', err);
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
