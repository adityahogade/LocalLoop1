import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(e) => changeLanguage(e.target.value)}
      className="bg-white border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-sm"
      aria-label="Change Language"
    >
      <option value="en">English</option>
      <option value="hi">हिंदी (Hindi)</option>
      <option value="mr">मराठी (Marathi)</option>
    </select>
  );
}
