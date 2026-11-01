import { stageIds, stageLabels, type StageEvent } from "../lib/orchestration";

export default function OrchestrationTrace({events}: {events: StageEvent[]}) {
  const latest = new Map(events.map(event => [event.stage, event]));
  return <ol className="orchestration-trace" aria-label="Case workflow stages">
    {stageIds.map(stage => {
      const event = latest.get(stage);
      if (!event) return null;
      return <li key={stage} data-status={event.status}>
        <span>{stageLabels[stage]}</span>
        <strong>{event.status}{event.durationMs !== undefined ? ` · ${(event.durationMs / 1000).toFixed(1)}s` : ""}</strong>
        {event.reason && <small>{event.reason}</small>}
      </li>;
    })}
  </ol>;
}
