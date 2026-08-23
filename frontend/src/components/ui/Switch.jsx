export default function Switch({ label, checked = false, onChange, className = '', ...props }) {
  return (
    <label className={`switch-field ${className}`.trim()}>
      <input type="checkbox" checked={checked} onChange={onChange} {...props} />
      <span className="switch" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
