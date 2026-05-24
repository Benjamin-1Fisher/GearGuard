import type { Item, Person, Zone } from "../../types/gearGuard";
import { CriticalityBadge, StatusBadge } from "./StatusBadge";

interface CheckoutPanelProps {
  items: Item[];
  people: Person[];
  zones: Zone[];
  selectedPersonId: string;
  selectedZoneId: string;
  conditionOut: string;
  onPersonChange: (personId: string) => void;
  onZoneChange: (zoneId: string) => void;
  onConditionChange: (condition: string) => void;
  onCheckout: (itemId: string) => void;
  onOpenItem: (item: Item) => void;
}

export function CheckoutPanel({
  items,
  people,
  zones,
  selectedPersonId,
  selectedZoneId,
  conditionOut,
  onPersonChange,
  onZoneChange,
  onConditionChange,
  onCheckout,
  onOpenItem,
}: CheckoutPanelProps) {
  const availableItems = items.filter((item) => item.status === "available");

  return (
    <section className="panel actionPanel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Warehouse gate</p>
          <h2>Scan / Check Out</h2>
        </div>
      </div>

      <div className="controlGrid">
        <label>
          Volunteer
          <select value={selectedPersonId} onChange={(event) => onPersonChange(event.target.value)}>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name} - {person.role}
              </option>
            ))}
          </select>
        </label>
        <label>
          Event zone
          <select value={selectedZoneId} onChange={(event) => onZoneChange(event.target.value)}>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Condition out
          <select value={conditionOut} onChange={(event) => onConditionChange(event.target.value)}>
            <option>Working, visual check passed</option>
            <option>Working, battery checked</option>
            <option>Complete kit, seals intact</option>
            <option>Minor cosmetic wear, usable</option>
          </select>
        </label>
      </div>

      <div className="scanList">
        {availableItems.map((item) => (
          <article className="itemRow" key={item.id}>
            <button className="itemIdentity" onClick={() => onOpenItem(item)} type="button">
              <span className="qrBlock" />
              <span>
                <strong>{item.name}</strong>
                <em>{item.qrCode}</em>
              </span>
            </button>
            <div className="itemMeta">
              <CriticalityBadge criticality={item.criticality} />
              <StatusBadge status={item.status} />
            </div>
            <button className="primaryButton" onClick={() => onCheckout(item.id)} type="button">
              Scan / Check Out
            </button>
          </article>
        ))}
        {availableItems.length === 0 && <div className="emptyState">All listed equipment has joined the event mission.</div>}
      </div>
    </section>
  );
}
