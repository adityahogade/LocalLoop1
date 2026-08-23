export default function ResponsiveGrid({ children, columns = 2, className = '' }) {
  return <div className={`responsive-grid responsive-grid--${columns} ${className}`.trim()}>{children}</div>;
}
