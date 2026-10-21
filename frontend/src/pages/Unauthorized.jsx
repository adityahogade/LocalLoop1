import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Unauthorized() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-extrabold text-red-500 tracking-tight">403</h1>
        <h2 className="text-2xl font-bold text-gray-800 mt-4 mb-2">
          {t('unauthorized', { ns: 'common' })}
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          You do not have the required permissions to view this dashboard. Please verify your account role settings.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
