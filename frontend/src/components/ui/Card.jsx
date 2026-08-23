export default function Card({ title, subtitle, children, className = '' }) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || subtitle) && (
        <header className="card__header">
          {title ? <h3>{title}</h3> : null}
          {subtitle ? <p>{subtitle}</p> : null}
        </header>
      )}
      <div className="card__body">{children}</div>
    </section>
  );
}
