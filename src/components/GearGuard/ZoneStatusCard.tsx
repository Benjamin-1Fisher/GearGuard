import type { Item, Zone } from "../../types/gearGuard";

interface ZoneStatusCardProps {
  zone: Zone;
  items: Item[];
}

export function ZoneStatusCard({ zone, items }: ZoneStatusCardProps) {
  const zoneItems = items.filter((item) => item.currentZone === zone.name && item.status !== "available");
  const outsideCount = zoneItems.filter((item) => item.status === "in_event" || item.status === "missing").length;
  const issueCount = zoneItems.filter((item) => ["missing", "damaged", "needs_inspection"].includes(item.status)).length;

  return (
    <article className={`zoneCard ${issueCount > 0 ? "hasIssue" : ""}`}>
      <div>
        <h3>{zone.name}</h3>
        <p>{zone.type}</p>
      </div>
      <div className="zoneNumbers">
        <strong>{outsideCount}</strong>
        <span>active items</span>
      </div>
      <div className={issueCount > 0 ? "zoneIssue attention" : "zoneIssue ok"}>
        {issueCount > 0 ? `${issueCount} unresolved` : "Clear"}
      </div>
    </article>
  );
}
