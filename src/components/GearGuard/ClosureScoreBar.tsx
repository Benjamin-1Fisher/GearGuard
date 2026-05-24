export function ClosureScoreBar({ score, ready }: { score: number; ready: boolean }) {
  return (
    <div className="closureScore">
      <div className="scoreTopline">
        <span>{ready ? "האירוע מוכן לסגירה" : "משימת חזרה לבסיס פעילה"}</span>
        <strong>{score}%</strong>
      </div>
      <div className="scoreTrack" aria-label={`ציון סגירת אירוע ${score} אחוז`}>
        <div className={ready ? "scoreFill ready" : "scoreFill"} style={{ width: `${score}%` }} />
      </div>
      <p>
        {ready
          ? "כל שרשראות האחריות הקריטיות נסגרו או הועברו רשמית לבדיקה."
          : "האירוע נשאר פתוח עד שכל פריט קריטי חוזר או מקבל טיפול אחריות ברור."}
      </p>
    </div>
  );
}
