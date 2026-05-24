export function ClosureScoreBar({ score, ready }: { score: number; ready: boolean }) {
  return (
    <div className="closureScore">
      <div className="scoreTopline">
        <span>{ready ? "Event Ready to Close" : "Return-to-Base mission active"}</span>
        <strong>{score}%</strong>
      </div>
      <div className="scoreTrack" aria-label={`Event closure score ${score} percent`}>
        <div className={ready ? "scoreFill ready" : "scoreFill"} style={{ width: `${score}%` }} />
      </div>
      <p>
        {ready
          ? "All critical chains are closed or formally handed to inspection."
          : "The event stays open until every critical item is back or accounted for."}
      </p>
    </div>
  );
}
