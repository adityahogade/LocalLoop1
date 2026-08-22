export default function Button({ children, variant = 'primary', type = 'button', className = '', disabled = false, loading = false, ...props }) {
  return (
    <button
      type={type}
      className={`button button--${variant} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
