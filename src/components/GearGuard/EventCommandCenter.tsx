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

const STORAGE_KEY = "gearguard-event-command-center-v3-he";

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
  const [conditionOut, setConditionOut] = useState("תקין, בדיקה ויזואלית עברה");
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

    const log = makeActivity(`${person.name} הוציא/ה את ${item.name} אל ${zone.name}`, "info");
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
    returned_ok: "הוחזר תקין",
    damaged: "הוחזר פגום",
    missing: "סומן כחסר",
    needs_inspection: "נשלח לבדיקה",
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
    const log = makeActivity(`${item.name} ${returnActionCopy[status]} על ידי ${item.responsiblePerson ?? "המחסן"}`, severity);
    const conditionIn =
      status === "returned_ok"
        ? "הוחזר תקין ועובד"
        : status === "damaged"
          ? "הוחזר פגום"
          : status === "missing"
            ? "לא הוחזר - נדרשת משימת חילוץ"
            : "הוחזר - נפתחה מסירה לבדיקה";

    setItems((current) =>
      current.map((entry) =>
        entry.id === itemId
          ? appendItemHistory(
              {
                ...entry,
                status,
                conditionIn,
                currentZone: status === "returned_ok" || status === "needs_inspection" || status === "damaged" ? "בסיס מחסן" : entry.currentZone,
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
    const assignedTo = people.find((person) => person.id === "person-ben")?.name ?? people[0].name;
    const suggestedAction = getSuggestedAction(item);
    const task: RescueTask = {
      id: crypto.randomUUID(),
      itemId: item.id,
      itemName: item.name,
      assignedTo,
      suggestedAction,
      status: "open",
    };
    const log = makeActivity(`נוצרה משימת חילוץ עבור ${item.name} - הוקצתה אל ${assignedTo}`, "danger");
    setRescueTasks((current) => [task, ...current]);
    addActivity(log);
  };

  const completeRescueTask = (taskId: string) => {
    const task = rescueTasks.find((entry) => entry.id === taskId);
    if (!task) {
      return;
    }
    const log = makeActivity(`משימת חילוץ הושלמה עבור ${task.itemName}`, "success");
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
    { key: "dashboard", label: "מרכז פיקוד" },
    { key: "checkout", label: "יציאה מהמחסן", count: items.filter((item) => item.status === "available").length },
    { key: "return", label: "טקס החזרה", count: missionItems(items).length },
    { key: "rescue", label: "מצב חילוץ", count: items.filter((item) => item.status === "missing").length },
  ];

  const guideSteps: Array<{ number: string; title: string; copy: string; tab: TabKey }> = [
    {
      number: "1",
      title: "הוציאו ציוד מהמחסן",
      copy: "בחרו אחראי ואזור, ואז סרקו פריט זמין.",
      tab: "checkout",
    },
    {
      number: "2",
      title: "בצעו טקס החזרה",
      copy: "סמנו פריט כתקין, פגום, חסר או דורש בדיקה.",
      tab: "return",
    },
    {
      number: "3",
      title: "חילוץ פריט חסר",
      copy: "אם משהו חסר, פתחו משימת חילוץ עם פעולה מומלצת.",
      tab: "rescue",
    },
  ];

  return (
    <main className="appShell">
      <header className="commandHeader">
        <div>
          <p className="eyebrow">מרכז פיקוד גירגארד</p>
          <h1>{event.name}</h1>
          <p className="headerCopy">משימת חזרה לבסיס לציוד הקמפוס של אפקה, כולל אחראים, אזורים ומוכנות לסגירה רשמית.</p>
        </div>
        <div className="headerStatus">
          <span className={readyToClose ? "statusLight ready" : "statusLight blocked"} />
          <strong>{readyToClose ? "האירוע מוכן לסגירה" : "הסגירה חסומה"}</strong>
          <button onClick={resetDemo} type="button">
            איפוס דמו
          </button>
        </div>
      </header>

      <nav className="tabBar" aria-label="מסכי גירגארד">
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

      <section className="missionBriefing panel" aria-label="תדריך דמו מהיר">
        <div className="briefCopy">
          <p className="eyebrow">התחלה מהירה</p>
          <h2>איך בודקים את הדמו?</h2>
          <p>המערכת מנהלת משימת חזרה לבסיס: כל פריט צריך אחראי, אזור, מצב יציאה ומצב חזרה לפני שאפשר לסגור אירוע.</p>
        </div>
        <div className="briefSteps">
          {guideSteps.map((step) => (
            <button className="briefStep" key={step.number} onClick={() => setActiveTab(step.tab)} type="button">
              <span className="stepNumber">{step.number}</span>
              <span>
                <strong>{step.title}</strong>
                <em>{step.copy}</em>
              </span>
            </button>
          ))}
        </div>
      </section>

      {activeTab === "dashboard" && (
        <div className="dashboardGrid">
          <section className="closureHero panel">
            <div className="heroCopy">
              <p className="eyebrow">סטטוס ראשי</p>
              <h2>ציון סגירת אירוע</h2>
              <p>
                זה לא מלאי רגיל. זו שרשרת אחריות חיה שקובעת אם האירוע יכול להסתיים רשמית.
              </p>
            </div>
            <ClosureScoreBar score={event.closureScore} ready={readyToClose} />
          </section>

          <section className="metricGrid" aria-label="מדדי אירוע">
            <MetricCard label="פריטים שיצאו" value={stats.checkedOut} tone="progress" detail={`${stats.outside} עדיין מחוץ לבסיס`} />
            <MetricCard label="פריטים שחזרו" value={stats.returned} tone="ok" detail="תקין או הועבר לבדיקה" />
            <MetricCard label="פריטים קריטיים חסרים" value={stats.missingCritical} tone={stats.missingCritical ? "danger" : "ok"} detail="חוסם סגירת אירוע" />
            <MetricCard label="פריטים פגומים" value={stats.damagedOrCheck} tone={stats.damagedOrCheck ? "attention" : "ok"} detail="פגום או דורש בדיקה" />
            <MetricCard label="שרשראות אחריות פתוחות" value={stats.openChains} tone={stats.openChains ? "attention" : "ok"} detail="עדיין משויכות לאנשים" />
          </section>

          <section className="panel zonesPanel">
            <div className="panelHeader">
              <div>
                <p className="eyebrow">מפת הקמפוס</p>
                <h2>אזורי האירוע</h2>
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
                <p className="eyebrow">אחריות בזמן אמת</p>
                <h2>ציוד מחוץ לבסיס</h2>
              </div>
            </div>
            <div className="compactItemList">
              {items
                .filter((item) => ["in_event", "missing", "damaged"].includes(item.status))
                .map((item) => (
                  <button className="compactItem" key={item.id} onClick={() => setSelectedItem(item)} type="button">
                    <span>
                      <strong>{item.name}</strong>
                      <em>{item.responsiblePerson ?? "מחסן"} - {item.currentZone ?? "בסיס"}</em>
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
