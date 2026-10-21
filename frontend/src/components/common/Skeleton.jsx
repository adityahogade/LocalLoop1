import React from 'react';

export default function Skeleton({ type = 'line', count = 1, className = '' }) {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {items.map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 animate-pulse">
            <div className="h-40 bg-gray-200 rounded-lg w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-8 bg-gray-200 rounded w-1/3 pt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden animate-pulse">
        <div className="h-12 bg-gray-100 border-b border-gray-200 w-full" />
        {items.map((_, i) => (
          <div key={i} className="flex justify-between items-center px-6 py-4 border-b border-gray-100 space-x-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/6" />
            <div className="h-4 bg-gray-200 rounded w-1/6" />
            <div className="h-4 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-2 w-full ${className}`}>
      {items.map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-gray-200 rounded animate-pulse ${
            i === items.length - 1 && items.length > 1 ? 'w-2/3' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}
