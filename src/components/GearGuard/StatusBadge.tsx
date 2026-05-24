import type { Criticality, ItemStatus } from "../../types/gearGuard";

const statusLabels: Record<ItemStatus, string> = {
  available: "זמין",
  in_event: "באירוע",
  returned_ok: "הוחזר תקין",
  damaged: "פגום",
  missing: "חסר",
  needs_inspection: "דורש בדיקה",
};

const criticalityLabels: Record<Criticality, string> = {
  Critical: "קריטי",
  Standard: "רגיל",
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return <span className={`badge status-${status}`}>{statusLabels[status]}</span>;
}

export function CriticalityBadge({ criticality }: { criticality: Criticality }) {
  return <span className={`badge criticality-${criticality.toLowerCase()}`}>{criticalityLabels[criticality]}</span>;
}
