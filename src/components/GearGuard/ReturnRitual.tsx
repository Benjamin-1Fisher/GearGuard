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
          <p className="eyebrow">Closing ritual</p>
          <h2>Return Ritual</h2>
        </div>
        <span className="ritualPill">{missionItems.length} mission items</span>
      </div>

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
              <span>Owner: {item.responsiblePerson ?? "Warehouse"}</span>
              <span>Zone: {item.currentZone ?? "Base"}</span>
              <span>Out: {item.conditionOut ?? "Not checked out"}</span>
              <span>In: {item.conditionIn ?? "Awaiting scan"}</span>
            </div>
            <div className="itemMeta">
              <CriticalityBadge criticality={item.criticality} />
              <StatusBadge status={item.status} />
            </div>
            <div className="ritualActions">
              <button onClick={() => onReturnAction(item.id, "returned_ok")} type="button">
                Returned & OK
              </button>
              <button onClick={() => onReturnAction(item.id, "damaged")} type="button">
                Returned Damaged
              </button>
              <button onClick={() => onReturnAction(item.id, "missing")} type="button">
                Mark Missing
              </button>
              <button onClick={() => onReturnAction(item.id, "needs_inspection")} type="button">
                Needs Inspection
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
