export default function Drawer({ open, title, onClose, children, side = 'right' }) {
  if (!open) return null;

  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className={`drawer drawer--${side}`} role="dialog" aria-modal="true" aria-label={title || 'Drawer'} onClick={(event) => event.stopPropagation()}>
        <header className="drawer__header">
          {title ? <h3>{title}</h3> : null}
          <button type="button" className="icon-button" aria-label="Close drawer" onClick={onClose}>×</button>
        </header>
        <div className="drawer__body">{children}</div>
      </aside>
    </div>
  );
}
