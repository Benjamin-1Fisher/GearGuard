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
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label={`${item.name} item passport`}>
      <aside className="passportDrawer">
        <div className="passportHeader">
          <div>
            <p className="eyebrow">Item Passport</p>
            <h2>{item.name}</h2>
          </div>
          <button className="iconButton" onClick={onClose} type="button" aria-label="Close item passport">
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
            <span>Category</span>
            <strong>{item.category}</strong>
          </div>
          <div>
            <span>Home base</span>
            <strong>{item.homeLocation}</strong>
          </div>
          <div>
            <span>Current owner</span>
            <strong>{item.responsiblePerson ?? "Warehouse"}</strong>
          </div>
          <div>
            <span>Current zone</span>
            <strong>{item.currentZone ?? "Base"}</strong>
          </div>
          <div>
            <span>Condition out</span>
            <strong>{item.conditionOut ?? "Not checked out"}</strong>
          </div>
          <div>
            <span>Condition in</span>
            <strong>{item.conditionIn ?? "Awaiting return"}</strong>
          </div>
        </div>

        <div className="passportHistory">
          <h3>History</h3>
          {item.history.map((entry) => (
            <div className={`timelineItem severity-${entry.severity}`} key={entry.id}>
              <span className="timelineDot" />
              <div>
                <p>{entry.text}</p>
                <time>{new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
