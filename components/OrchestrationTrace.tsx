import { stageIds, stageLabels, type StageEvent } from "../lib/orchestration";

export default function OrchestrationTrace({ events, expanded = false }: { events: StageEvent[]; expanded?: boolean }) {
  const latest = new Map(events.map(event => [event.stage, event]));
  const completed = [...latest.values()].filter(event => event.status === "completed").length;
  const running = [...latest.values()].find(event => event.status === "running");
  return <details className="workflow-details" open={expanded}>
    <summary><span className={running ? "workflow-indicator running" : "workflow-indicator"}/><span>{running ? stageLabels[running.stage] : "Execution details"}</span><small>{completed} completed</small></summary>
    <ol className="orchestration-trace" aria-label="Case workflow stages">{stageIds.map(stage => {
      const event = latest.get(stage);
      if (!event) return null;
      return <li key={stage} data-status={event.status}><span>{stageLabels[stage]}</span><strong>{event.status}{event.durationMs !== undefined ? ` · ${(event.durationMs / 1000).toFixed(1)}s` : ""}</strong>{event.reason && <small>{event.reason}</small>}</li>;
    })}</ol>
  </details>;
}
