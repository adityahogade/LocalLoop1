export default function Breadcrumbs({ items = [] }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.label || index} className="breadcrumb-item">
          {index > 0 ? <span className="breadcrumb-separator">/</span> : null}
          {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
