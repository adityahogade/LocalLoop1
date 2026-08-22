export default function Section({ title, subtitle, children, actions, className = '' }) {
  return (
    <section className={`section ${className}`.trim()}>
      {(title || subtitle || actions) && (
        <header className="section__header">
          <div>
            {title ? <h2 className="section__title">{title}</h2> : null}
            {subtitle ? <p className="section__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="section__actions">{actions}</div> : null}
        </header>
      )}
      <div className="section__body">{children}</div>
    </section>
  );
}
