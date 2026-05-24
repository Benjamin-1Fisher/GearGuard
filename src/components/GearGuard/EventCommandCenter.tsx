import { useEffect, useMemo, useState } from "react";
import { initialActivity, initialEvent, initialItems, initialRescueTasks, people, zones } from "../../data/gearGuardMock";
import type { ActivityLog, EventMission, Item, ItemStatus, RescueTask } from "../../types/gearGuard";
import { ActivityTimeline } from "./ActivityTimeline";
import { CheckoutPanel } from "./CheckoutPanel";
import { ClosureScoreBar } from "./ClosureScoreBar";
import { ItemPassportModal } from "./ItemPassportModal";
import { MetricCard } from "./MetricCard";
import { RescueMode, getSuggestedAction } from "./RescueMode";
import { ReturnRitual } from "./ReturnRitual";
import { StatusBadge } from "./StatusBadge";
import { ZoneStatusCard } from "./ZoneStatusCard";

const STORAGE_KEY = "gearguard-event-command-center-v1";

type TabKey = "dashboard" | "checkout" | "return" | "rescue";

interface PersistedState {
  items: Item[];
  activity: ActivityLog[];
  rescueTasks: RescueTask[];
}

const nowIso = () => new Date().toISOString();

const makeActivity = (text: string, severity: ActivityLog["severity"]): ActivityLog => ({
  id: crypto.randomUUID(),
  timestamp: nowIso(),
  text,
  severity,
});

const missionItems = (items: Item[]) => items.filter((item) => item.status !== "available");

function calculateClosureScore(items: Item[]) {
  const criticalMissionItems = missionItems(items).filter((item) => item.criticality === "Critical");
  if (criticalMissionItems.length === 0) {
    return 100;
  }

  const score = criticalMissionItems.reduce((total, item) => {
    if (item.status === "returned_ok" || item.status === "needs_inspection") {
      return total + 1;
    }
    if (item.status === "damaged") {
      return total + 0.35;
    }
    if (item.status === "in_event") {
      return total + 0.45;
    }
    return total;
  }, 0);

  const unmanagedDamagePenalty = items.some((item) => item.status === "damaged") ? 8 : 0;
  return Math.max(0, Math.min(100, Math.round((score / criticalMissionItems.length) * 100) - unmanagedDamagePenalty));
}

function canCloseEvent(items: Item[]) {
  const criticalOpen = missionItems(items).some(
    (item) =>
      item.criticality === "Critical" &&
      !["returned_ok", "needs_inspection"].includes(item.status),
  );
  const unmanagedDamage = items.some((item) => item.status === "damaged");
  return !criticalOpen && !unmanagedDamage;
}

function loadPersistedState(): PersistedState {
  const fallback = {
    items: initialItems,
    activity: initialActivity,
    rescueTasks: initialRescueTasks,
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return fallback;
    }
    return JSON.parse(stored) as PersistedState;
  } catch {
    return fallback;
  }
}

export function EventCommandCenter() {
  const persisted = useMemo(loadPersistedState, []);
  const [items, setItems] = useState<Item[]>(persisted.items);
  const [activity, setActivity] = useState<ActivityLog[]>(persisted.activity);
  const [rescueTasks, setRescueTasks] = useState<RescueTask[]>(persisted.rescueTasks);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [selectedPersonId, setSelectedPersonId] = useState(people[0].id);
  const [selectedZoneId, setSelectedZoneId] = useState(zones[0].id);
  const [conditionOut, setConditionOut] = useState("Working, visual check passed");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const closureScore = useMemo(() => calculateClosureScore(items), [items]);
  const readyToClose = useMemo(() => canCloseEvent(items), [items]);
  const event: EventMission = {
    ...initialEvent,
    closureScore,
    status: readyToClose ? "ready_to_close" : "blocked",
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, activity, rescueTasks }));
  }, [items, activity, rescueTasks]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }
    const freshItem = items.find((item) => item.id === selectedItem.id);
    setSelectedItem(freshItem ?? null);
  }, [items, selectedItem]);

  const stats = useMemo(() => {
    const mission = missionItems(items);
    const returned = mission.filter((item) => ["returned_ok", "damaged", "needs_inspection"].includes(item.status)).length;
    const missingCritical = mission.filter((item) => item.criticality === "Critical" && item.status === "missing").length;
    const damagedOrCheck = mission.filter((item) => ["damaged", "needs_inspection"].includes(item.status)).length;
    const openChains = mission.filter((item) => ["in_event", "missing", "damaged"].includes(item.status)).length;
    const outside = mission.filter((item) => ["in_event", "missing"].includes(item.status)).length;
    return { checkedOut: mission.length, returned, missingCritical, damagedOrCheck, openChains, outside };
  }, [items]);

  const addActivity = (entry: ActivityLog) => {
    setActivity((current) => [entry, ...current]);
  };

  const appendItemHistory = (item: Item, entry: ActivityLog) => ({
    ...item,
    history: [entry, ...item.history],
    lastActionAt: entry.timestamp,
  });

  const checkoutItem = (itemId: string) => {
    const person = people.find((entry) => entry.id === selectedPersonId) ?? people[0];
    const zone = zones.find((entry) => entry.id === selectedZoneId) ?? zones[0];
    const item = items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    const log = makeActivity(`${person.name} checked out ${item.name} to ${zone.name}`, "info");
    setItems((current) =>
      current.map((entry) =>
        entry.id === itemId
          ? appendItemHistory(
              {
                ...entry,
                status: "in_event",
                responsiblePerson: person.name,
                currentZone: zone.name,
                conditionOut,
                conditionIn: null,
              },
              log,
            )
          : entry,
      ),
    );
    addActivity(log);
    setActiveTab("dashboard");
  };

  const returnActionCopy: Record<Extract<ItemStatus, "returned_ok" | "damaged" | "missing" | "needs_inspection">, string> = {
    returned_ok: "returned OK",
    damaged: "returned damaged",
    missing: "marked missing",
    needs_inspection: "sent to inspection",
  };

  const updateReturnStatus = (
    itemId: string,
    status: Extract<ItemStatus, "returned_ok" | "damaged" | "missing" | "needs_inspection">,
  ) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    const severity = status === "returned_ok" ? "success" : status === "missing" || status === "damaged" ? "danger" : "warning";
    const log = makeActivity(`${item.name} ${returnActionCopy[status]} by ${item.responsiblePerson ?? "warehouse"}`, severity);
    const conditionIn =
      status === "returned_ok"
        ? "Returned working"
        : status === "damaged"
          ? "Returned damaged"
          : status === "missing"
            ? "Not returned - rescue required"
            : "Returned, inspection handoff opened";

    setItems((current) =>
      current.map((entry) =>
        entry.id === itemId
          ? appendItemHistory(
              {
                ...entry,
                status,
                conditionIn,
                currentZone: status === "returned_ok" || status === "needs_inspection" || status === "damaged" ? "Warehouse Base" : entry.currentZone,
              },
              log,
            )
          : entry,
      ),
    );
    addActivity(log);
    if (status === "missing") {
      setActiveTab("rescue");
    }
  };

  const createRescueTask = (item: Item) => {
    const assignedTo = people.find((person) => person.name === "Ben")?.name ?? people[0].name;
    const suggestedAction = getSuggestedAction(item);
    const task: RescueTask = {
      id: crypto.randomUUID(),
      itemId: item.id,
      itemName: item.name,
      assignedTo,
      suggestedAction,
      status: "open",
    };
    const log = makeActivity(`Rescue task created for ${item.name} - assigned to ${assignedTo}`, "danger");
    setRescueTasks((current) => [task, ...current]);
    addActivity(log);
  };

  const completeRescueTask = (taskId: string) => {
    const task = rescueTasks.find((entry) => entry.id === taskId);
    if (!task) {
      return;
    }
    const log = makeActivity(`Rescue task completed for ${task.itemName}`, "success");
    setRescueTasks((current) => current.map((entry) => (entry.id === taskId ? { ...entry, status: "done" } : entry)));
    addActivity(log);
  };

  const resetDemo = () => {
    setItems(initialItems);
    setActivity(initialActivity);
    setRescueTasks(initialRescueTasks);
    setSelectedItem(null);
    setActiveTab("dashboard");
    localStorage.removeItem(STORAGE_KEY);
  };

  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: "dashboard", label: "Command Center" },
    { key: "checkout", label: "Warehouse Checkout", count: items.filter((item) => item.status === "available").length },
    { key: "return", label: "Return Ritual", count: missionItems(items).length },
    { key: "rescue", label: "Rescue Mode", count: items.filter((item) => item.status === "missing").length },
  ];

  return (
    <main className="appShell">
      <header className="commandHeader">
        <div>
          <p className="eyebrow">GearGuard Event Command Center</p>
          <h1>{event.name}</h1>
          <p className="headerCopy">Return-to-Base mission for Afeka campus equipment, owners, zones, and closure readiness.</p>
        </div>
        <div className="headerStatus">
          <span className={readyToClose ? "statusLight ready" : "statusLight blocked"} />
          <strong>{readyToClose ? "Event Ready to Close" : "Closure Blocked"}</strong>
          <button onClick={resetDemo} type="button">
            Reset Demo
          </button>
        </div>
      </header>

      <nav className="tabBar" aria-label="GearGuard screens">
        {tabs.map((tab) => (
          <button
            className={activeTab === tab.key ? "active" : ""}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.label}
            {typeof tab.count === "number" && <span>{tab.count}</span>}
          </button>
        ))}
      </nav>

      {activeTab === "dashboard" && (
        <div className="dashboardGrid">
          <section className="closureHero panel">
            <div className="heroCopy">
              <p className="eyebrow">Big status</p>
              <h2>Event Closure Score</h2>
              <p>
                This is not inventory. It is the live chain of responsibility that decides whether the event can
                officially end.
              </p>
            </div>
            <ClosureScoreBar score={event.closureScore} ready={readyToClose} />
          </section>

          <section className="metricGrid" aria-label="Event metrics">
            <MetricCard label="Items checked out" value={stats.checkedOut} tone="progress" detail={`${stats.outside} still outside base`} />
            <MetricCard label="Items returned" value={stats.returned} tone="ok" detail="OK or inspection handoff" />
            <MetricCard label="Missing critical items" value={stats.missingCritical} tone={stats.missingCritical ? "danger" : "ok"} detail="Blocks event closure" />
            <MetricCard label="Damaged items" value={stats.damagedOrCheck} tone={stats.damagedOrCheck ? "attention" : "ok"} detail="Damaged or needs-check" />
            <MetricCard label="Open responsibility chains" value={stats.openChains} tone={stats.openChains ? "attention" : "ok"} detail="Still assigned to people" />
          </section>

          <section className="panel zonesPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Campus map</p>
                <h2>Event Zones</h2>
              </div>
            </div>
            <div className="zoneGrid">
              {zones.map((zone) => (
                <ZoneStatusCard items={items} key={zone.id} zone={zone} />
              ))}
            </div>
          </section>

          <ActivityTimeline activity={activity} />

          <section className="panel outsidePanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">Currently accountable</p>
                <h2>Equipment Outside Base</h2>
              </div>
            </div>
            <div className="compactItemList">
              {items
                .filter((item) => ["in_event", "missing", "damaged"].includes(item.status))
                .map((item) => (
                  <button className="compactItem" key={item.id} onClick={() => setSelectedItem(item)} type="button">
                    <span>
                      <strong>{item.name}</strong>
                      <em>{item.responsiblePerson ?? "Warehouse"} - {item.currentZone ?? "Base"}</em>
                    </span>
                    <StatusBadge status={item.status} />
                  </button>
                ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === "checkout" && (
        <CheckoutPanel
          conditionOut={conditionOut}
          items={items}
          onCheckout={checkoutItem}
          onConditionChange={setConditionOut}
          onOpenItem={setSelectedItem}
          onPersonChange={setSelectedPersonId}
          onZoneChange={setSelectedZoneId}
          people={people}
          selectedPersonId={selectedPersonId}
          selectedZoneId={selectedZoneId}
          zones={zones}
        />
      )}

      {activeTab === "return" && (
        <ReturnRitual items={items} onOpenItem={setSelectedItem} onReturnAction={updateReturnStatus} />
      )}

      {activeTab === "rescue" && (
        <RescueMode
          items={items}
          onCompleteTask={completeRescueTask}
          onCreateTask={createRescueTask}
          onOpenItem={setSelectedItem}
          people={people}
          rescueTasks={rescueTasks}
        />
      )}

      <ItemPassportModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </main>
  );
}
