export default function Spinner({ size = 'md', label = 'Loading' }) {
  return (
    <div className={`spinner spinner--${size}`} role="status" aria-live="polite" aria-label={label}>
      <span className="spinner__ring" />
    </div>
  );
}
