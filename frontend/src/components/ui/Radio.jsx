export default function Radio({ label, className = '', ...props }) {
  return (
    <label className={`radio-field ${className}`.trim()}>
      <input type="radio" {...props} />
      <span>{label}</span>
    </label>
  );
}
