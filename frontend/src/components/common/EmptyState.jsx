import React from 'react';

export default function EmptyState({ title, description, actionText, onAction, icon }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-white max-w-lg mx-auto">
      {icon ? (
        <div className="text-gray-400 mb-4">{icon}</div>
      ) : (
        <div className="text-4xl text-gray-300 mb-4">📭</div>
      )}
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 leading-relaxed max-w-sm">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
