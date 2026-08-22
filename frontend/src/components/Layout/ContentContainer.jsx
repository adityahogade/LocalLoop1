export default function ContentContainer({ children, className = '' }) {
  return <div className={`content-container ${className}`.trim()}>{children}</div>;
}
