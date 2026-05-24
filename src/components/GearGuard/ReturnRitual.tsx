import type { Item, ItemStatus } from "../../types/gearGuard";
import { CriticalityBadge, StatusBadge } from "./StatusBadge";

interface ReturnRitualProps {
  items: Item[];
  onReturnAction: (itemId: string, status: Extract<ItemStatus, "returned_ok" | "damaged" | "missing" | "needs_inspection">) => void;
  onOpenItem: (item: Item) => void;
}

export function ReturnRitual({ items, onReturnAction, onOpenItem }: ReturnRitualProps) {
  const missionItems = items.filter((item) => item.status !== "available");

  return (
    <section className="panel actionPanel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">טקס סגירה</p>
          <h2>טקס החזרה</h2>
        </div>
        <span className="ritualPill">{missionItems.length} פריטי משימה</span>
      </div>
      <p className="screenHint">
        זה מסך הסגירה: עוברים על כל פריט שיצא מהמחסן. פריט קריטי חסר יחסום את סגירת האירוע.
      </p>

      <div className="ritualList">
        {missionItems.map((item) => (
          <article className={`ritualItem statusBorder-${item.status}`} key={item.id}>
            <button className="itemIdentity" onClick={() => onOpenItem(item)} type="button">
              <span className="qrBlock" />
              <span>
                <strong>{item.name}</strong>
                <em>{item.qrCode}</em>
              </span>
            </button>
            <div className="ritualFacts">
              <span>אחראי/ת: {item.responsiblePerson ?? "מחסן"}</span>
              <span>אזור: {item.currentZone ?? "בסיס"}</span>
              <span>מצב ביציאה: {item.conditionOut ?? "לא יצא"}</span>
              <span>מצב בחזרה: {item.conditionIn ?? "ממתין לסריקה"}</span>
            </div>
            <div className="itemMeta">
              <CriticalityBadge criticality={item.criticality} />
              <StatusBadge status={item.status} />
            </div>
            <div className="ritualActions">
              <button onClick={() => onReturnAction(item.id, "returned_ok")} type="button">
                הוחזר תקין
              </button>
              <button onClick={() => onReturnAction(item.id, "damaged")} type="button">
                הוחזר פגום
              </button>
              <button onClick={() => onReturnAction(item.id, "missing")} type="button">
                סימון כחסר
              </button>
              <button onClick={() => onReturnAction(item.id, "needs_inspection")} type="button">
                דורש בדיקה
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
