import type { Criticality, ItemStatus } from "../../types/gearGuard";

const statusLabels: Record<ItemStatus, string> = {
  available: "Available",
  in_event: "In Event",
  returned_ok: "Returned OK",
  damaged: "Damaged",
  missing: "Missing",
  needs_inspection: "Needs Inspection",
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return <span className={`badge status-${status}`}>{statusLabels[status]}</span>;
}

export function CriticalityBadge({ criticality }: { criticality: Criticality }) {
  return <span className={`badge criticality-${criticality.toLowerCase()}`}>{criticality}</span>;
}
