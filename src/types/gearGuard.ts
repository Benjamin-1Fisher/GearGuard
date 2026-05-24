export type EventStatus = "active" | "blocked" | "ready_to_close";

export type ItemStatus =
  | "available"
  | "in_event"
  | "returned_ok"
  | "damaged"
  | "missing"
  | "needs_inspection";

export type Criticality = "Critical" | "Standard";

export type ActivitySeverity = "info" | "warning" | "danger" | "success";

export interface EventMission {
  id: string;
  name: string;
  date: string;
  status: EventStatus;
  closureScore: number;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  phone: string;
}

export interface Zone {
  id: string;
  name: string;
  type: string;
  issueCount: number;
}

export interface ItemHistoryEntry {
  id: string;
  timestamp: string;
  text: string;
  severity: ActivitySeverity;
}

export interface Item {
  id: string;
  qrCode: string;
  name: string;
  category: string;
  criticality: Criticality;
  status: ItemStatus;
  homeLocation: string;
  currentZone: string | null;
  responsiblePerson: string | null;
  conditionOut: string | null;
  conditionIn: string | null;
  lastActionAt: string;
  history: ItemHistoryEntry[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  text: string;
  severity: ActivitySeverity;
}

export interface RescueTask {
  id: string;
  itemId: string;
  itemName: string;
  assignedTo: string;
  suggestedAction: string;
  status: "open" | "done";
}
