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
  if (item.currentZone?.includes("אולם") || item.currentZone?.includes("Main Hall")) {
    return "בדקו את עמדת הסאונד ושולחן המרצה באולם הראשי";
  }
  if (item.currentZone?.includes("הרשמה") || item.currentZone?.includes("Registration")) {
    return "שאלו את צוות דוכן 3 וסרקו את עמדת ההרשמה";
  }
  if (item.currentZone?.includes("רובוטיקה") || item.currentZone?.includes("Robotics")) {
    return "שלחו רץ למעבדת הרובוטיקה";
  }
  if (item.responsiblePerson) {
    return `להתקשר אל ${item.responsiblePerson}`;
  }
  return "לסרוק את האזור האחרון ולעדכן את מנהל המחסן";
}

export function RescueMode({ items, people, rescueTasks, onCreateTask, onCompleteTask, onOpenItem }: RescueModeProps) {
  const missingItems = items.filter((item) => item.status === "missing");
  const leadRunner = people.find((person) => person.id === "person-ben") ?? people[0];

  return (
    <section className="panel rescuePanel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">חילוץ פעיל</p>
          <h2>מצב חילוץ לפריט חסר</h2>
        </div>
        <span className="dangerPill">{missingItems.length} חסרים</span>
      </div>
      <p className="screenHint">
        כשפריט מסומן כחסר, גירגארד מציע את הפעולה הבאה ופותח משימת חילוץ לאדם אחראי.
      </p>

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
                  <span>אחראי/ת אחרון/ה: {item.responsiblePerson ?? "לא ידוע"}</span>
                  <span>אזור אחרון: {item.currentZone ?? "לא ידוע"}</span>
                  <strong>{getSuggestedAction(item)}</strong>
                </div>
                <button
                  className="primaryButton dangerButton"
                  disabled={Boolean(existingTask)}
                  onClick={() => onCreateTask(item)}
                  type="button"
                >
                  {existingTask ? `משימה פתוחה עבור ${leadRunner.name}` : "יצירת משימת חילוץ"}
                </button>
              </article>
            );
          })}
          {missingItems.length === 0 && (
            <div className="emptyState successState">אין פריטים חסרים. מצב חילוץ בהמתנה.</div>
          )}
        </div>

        <div className="taskBoard">
          <h3>משימות חילוץ</h3>
          {rescueTasks.map((task) => (
            <article className={`taskItem task-${task.status}`} key={task.id}>
              <div>
                <strong>{task.itemName}</strong>
                <p>{task.suggestedAction}</p>
                <span>מוקצה אל {task.assignedTo}</span>
              </div>
              {task.status === "open" && (
                <button onClick={() => onCompleteTask(task.id)} type="button">
                  בוצע
                </button>
              )}
            </article>
          ))}
          {rescueTasks.length === 0 && <div className="emptyState">אין עדיין משימות חילוץ.</div>}
        </div>
      </div>
    </section>
  );
}
