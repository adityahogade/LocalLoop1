export default function Input({ label, id, className = '', ...props }) {
  const inputId = id || props.name;

  return (
    <label className={`field ${className}`.trim()} htmlFor={inputId}>
      {label ? <span className="field__label">{label}</span> : null}
      <input id={inputId} className="field__input" {...props} />
    </label>
  );
}
