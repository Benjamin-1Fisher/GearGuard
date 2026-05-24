interface MetricCardProps {
  label: string;
  value: number | string;
  tone: "ok" | "attention" | "danger" | "progress" | "neutral";
  detail: string;
}

export function MetricCard({ label, value, tone, detail }: MetricCardProps) {
  return (
    <article className={`metricCard tone-${tone}`}>
      <div className="metricLabel">{label}</div>
      <div className="metricValue">{value}</div>
      <div className="metricDetail">{detail}</div>
    </article>
  );
}
