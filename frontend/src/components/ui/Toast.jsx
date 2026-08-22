export default function Toast({ open = false, message = '', tone = 'info' }) {
  if (!open || !message) return null;

  return (
    <div className={`toast toast--${tone}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
