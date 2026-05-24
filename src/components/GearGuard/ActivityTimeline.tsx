import type { ActivityLog } from "../../types/gearGuard";

export function ActivityTimeline({ activity }: { activity: ActivityLog[] }) {
  return (
    <section className="panel timelinePanel">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Live signal</p>
          <h2>Event Timeline</h2>
        </div>
        <span className="livePill">Live</span>
      </div>
      <div className="timelineList">
        {activity.slice(0, 8).map((entry) => (
          <div className={`timelineItem severity-${entry.severity}`} key={entry.id}>
            <span className="timelineDot" />
            <div>
              <p>{entry.text}</p>
              <time>{new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
