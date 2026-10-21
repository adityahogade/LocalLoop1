import React from 'react';

const STATUS_STYLES = {
  // Common / general
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',

  // Order & Delivery
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  skipped: 'bg-purple-100 text-purple-800 border-purple-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  confirmed: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  completed: 'bg-green-100 text-green-800 border-green-200',

  // Subscription specific
  paused: 'bg-amber-100 text-amber-800 border-amber-200',
  vacation: 'bg-purple-100 text-purple-800 border-purple-200',
  expired: 'bg-slate-100 text-slate-800 border-slate-200',

  // Settlement specific
  requested: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid: 'bg-green-100 text-green-800 border-green-200',

  // Payments specific
  created: 'bg-sky-100 text-sky-800 border-sky-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-amber-100 text-amber-800 border-amber-200',
  partially_refunded: 'bg-orange-100 text-orange-800 border-orange-200',
  unpaid: 'bg-red-100 text-red-800 border-red-200',
};

export default function StatusBadge({ status }) {
  const normalizedStatus = String(status || '').toLowerCase();
  const styleClass = STATUS_STYLES[normalizedStatus] || 'bg-gray-100 text-gray-800 border-gray-200';
  
  // Format string nicely (e.g. out_for_delivery -> Out For Delivery)
  const displayLabel = normalizedStatus
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styleClass}`}>
      {displayLabel}
    </span>
  );
}
