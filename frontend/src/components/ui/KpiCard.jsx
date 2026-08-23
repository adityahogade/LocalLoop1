export default function KpiCard({ label, value, hint, trend }) {
  return (
    <div className="kpi-card">
      <p className="kpi-card__label">{label}</p>
      <div className="kpi-card__value-row">
        <strong className="kpi-card__value">{value}</strong>
        {trend ? <span className="kpi-card__trend">{trend}</span> : null}
      </div>
      {hint ? <small className="kpi-card__hint">{hint}</small> : null}
    </div>
  );
}
