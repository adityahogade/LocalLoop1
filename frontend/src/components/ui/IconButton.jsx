export default function IconButton({ children, label, className = '', ...props }) {
  return (
    <button type="button" className={`icon-button ${className}`.trim()} aria-label={label} {...props}>
      {children}
    </button>
  );
}
