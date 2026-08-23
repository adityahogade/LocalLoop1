export default function Checkbox({ label, className = '', ...props }) {
  return (
    <label className={`checkbox-field ${className}`.trim()}>
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}
