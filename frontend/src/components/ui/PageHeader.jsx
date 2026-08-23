export default function PageHeader({ title, subtitle, actions, className = '' }) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div>
        {title ? <h1 className="page-header__title">{title}</h1> : null}
        {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
