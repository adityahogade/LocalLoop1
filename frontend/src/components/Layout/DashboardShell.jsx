export default function DashboardShell({ title, subtitle, actions, children }) {
  return (
    <div className="dashboard-shell">
      {(title || subtitle || actions) && (
        <header className="dashboard-shell__header">
          <div>
            {title ? <h1 className="dashboard-shell__title">{title}</h1> : null}
            {subtitle ? <p className="dashboard-shell__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="dashboard-shell__actions">{actions}</div> : null}
        </header>
      )}
      <div className="dashboard-shell__content">{children}</div>
    </div>
  );
}
