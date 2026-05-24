import type { Item } from "../../types/gearGuard";
import { CriticalityBadge, StatusBadge } from "./StatusBadge";

interface ItemPassportModalProps {
  item: Item | null;
  onClose: () => void;
}

export function ItemPassportModal({ item, onClose }: ItemPassportModalProps) {
  if (!item) {
    return null;
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label={`דרכון פריט של ${item.name}`}>
      <aside className="passportDrawer">
        <div className="passportHeader">
          <div>
            <p className="eyebrow">דרכון פריט</p>
            <h2>{item.name}</h2>
          </div>
          <button className="iconButton" onClick={onClose} type="button" aria-label="סגירת דרכון פריט">
            X
          </button>
        </div>

        <div className="passportQr">
          <span className="qrBlock largeQr" />
          <strong>{item.qrCode}</strong>
        </div>

        <div className="passportBadges">
          <CriticalityBadge criticality={item.criticality} />
          <StatusBadge status={item.status} />
        </div>

        <div className="passportFacts">
          <div>
            <span>קטגוריה</span>
            <strong>{item.category}</strong>
          </div>
          <div>
            <span>בסיס בית</span>
            <strong>{item.homeLocation}</strong>
          </div>
          <div>
            <span>אחראי/ת נוכחי/ת</span>
            <strong>{item.responsiblePerson ?? "מחסן"}</strong>
          </div>
          <div>
            <span>אזור נוכחי</span>
            <strong>{item.currentZone ?? "בסיס"}</strong>
          </div>
          <div>
            <span>מצב ביציאה</span>
            <strong>{item.conditionOut ?? "לא יצא"}</strong>
          </div>
          <div>
            <span>מצב בחזרה</span>
            <strong>{item.conditionIn ?? "ממתין להחזרה"}</strong>
          </div>
        </div>

        <div className="passportHistory">
          <h3>היסטוריה</h3>
          {item.history.map((entry) => (
            <div className={`timelineItem severity-${entry.severity}`} key={entry.id}>
              <span className="timelineDot" />
              <div>
                <p>{entry.text}</p>
                <time>{new Date(entry.timestamp).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}</time>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
