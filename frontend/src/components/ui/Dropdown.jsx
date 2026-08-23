import { useState } from 'react';

export default function Dropdown({ label, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="dropdown">
      <button type="button" className="button button--secondary" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {label}
      </button>
      {open ? <div className="dropdown__menu">{children}</div> : null}
    </div>
  );
}
