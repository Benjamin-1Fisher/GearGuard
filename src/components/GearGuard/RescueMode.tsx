import type { Item, Person, RescueTask } from "../../types/gearGuard";

interface RescueModeProps {
  items: Item[];
  people: Person[];
  rescueTasks: RescueTask[];
  onCreateTask: (item: Item) => void;
  onCompleteTask: (taskId: string) => void;
  onOpenItem: (item: Item) => void;
}

export function getSuggestedAction(item: Item) {
  if (item.currentZone?.includes("Main Hall")) {
    return "Check Main Hall sound desk and presenter table";
  }
  if (item.currentZone?.includes("Registration")) {
    return "Ask Booth 3 team and scan the registration desk";
  }
  if (item.currentZone?.includes("Robotics")) {
    return "Send runner to Robotics Lab";
  }
  if (item.responsiblePerson) {
    return `Call ${item.responsiblePerson}`;
  }
  return "Sweep last known zone and call the warehouse manager";
}

export function RescueMode({ items, people, rescueTasks, onCreateTask, onCompleteTask, onOpenItem }: RescueModeProps) {
  const missingItems = items.filter((item) => item.status === "missing");
  const leadRunner = people.find((person) => person.name === "Ben") ?? people[0];

  return (
    <section className="panel rescuePanel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Active recovery</p>
          <h2>Missing Item Rescue Mode</h2>
        </div>
        <span className="dangerPill">{missingItems.length} missing</span>
      </div>

      <div className="rescueGrid">
        <div className="rescueCandidates">
          {missingItems.map((item) => {
            const existingTask = rescueTasks.find((task) => task.itemId === item.id && task.status === "open");
            return (
              <article className="rescueCard" key={item.id}>
                <button className="itemIdentity" onClick={() => onOpenItem(item)} type="button">
                  <span className="qrBlock dangerQr" />
                  <span>
                    <strong>{item.name}</strong>
                    <em>{item.qrCode}</em>
                  </span>
                </button>
                <div className="rescueDetails">
                  <span>Last owner: {item.responsiblePerson ?? "Unknown"}</span>
                  <span>Last zone: {item.currentZone ?? "Unknown"}</span>
                  <strong>{getSuggestedAction(item)}</strong>
                </div>
                <button
                  className="primaryButton dangerButton"
                  disabled={Boolean(existingTask)}
                  onClick={() => onCreateTask(item)}
                  type="button"
                >
                  {existingTask ? `Task open for ${leadRunner.name}` : "Create Rescue Task"}
                </button>
              </article>
            );
          })}
          {missingItems.length === 0 && (
            <div className="emptyState successState">No missing items. Rescue Mode is standing by.</div>
          )}
        </div>

        <div className="taskBoard">
          <h3>Rescue Tasks</h3>
          {rescueTasks.map((task) => (
            <article className={`taskItem task-${task.status}`} key={task.id}>
              <div>
                <strong>{task.itemName}</strong>
                <p>{task.suggestedAction}</p>
                <span>Assigned to {task.assignedTo}</span>
              </div>
              {task.status === "open" && (
                <button onClick={() => onCompleteTask(task.id)} type="button">
                  Done
                </button>
              )}
            </article>
          ))}
          {rescueTasks.length === 0 && <div className="emptyState">No rescue tasks yet.</div>}
        </div>
      </div>
    </section>
  );
}
