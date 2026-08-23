export default function Textarea({ label, className = '', ...props }) {
  return (
    <label className={`field ${className}`.trim()}>
      {label ? <span className="field__label">{label}</span> : null}
      <textarea className="field__input field__input--textarea" {...props} />
    </label>
  );
}
