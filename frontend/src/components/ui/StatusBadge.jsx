export default function StatusBadge({ status, className = '' }) {
  const normalized = String(status || 'neutral').toLowerCase();
  return <span className={`status-badge status-badge--${normalized} ${className}`.trim()}>{status || 'Neutral'}</span>;
}
