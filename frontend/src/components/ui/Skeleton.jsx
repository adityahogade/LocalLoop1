export default function Skeleton({ lines = 3, className = '' }) {
  return (
    <div className={`skeleton ${className}`.trim()} aria-label="Loading content">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="skeleton__line" />
      ))}
    </div>
  );
}
