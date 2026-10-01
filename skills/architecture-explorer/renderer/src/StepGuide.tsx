import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "./components/ui/button";
import { useProject, format, decisionStyle } from "./core/project";
import type { ReplayRun } from "./core/types";

interface Props {
  run: ReplayRun;
  cursor: number;
  onStep: (index: number) => void;
  onInspect: (kind: "component" | "message", id: string) => void;
  onClose: () => void;
}
/** A narrative view of the existing replay, with no separate tour state or domain assumptions. */
export function StepGuide({ run, cursor, onStep, onInspect, onClose }: Props) {
  const { model, byId, project } = useProject();
  const list = useRef<HTMLOListElement>(null);
  const event = run.events[cursor];
  const edges = event.trace.edges.map((id) =>
    model.connections.find((e) => e.id === id)!,
  );
  const ids = [
    ...new Set([
      ...event.trace.nodes,
      ...edges.flatMap((e) => [e.source, e.target]),
    ]),
  ];
  useEffect(() => {
    const active = list.current?.querySelector<HTMLElement>(
      '[aria-current="step"]',
    );
    if (active && list.current) {
      const top = active.offsetTop;
      list.current.scrollTop = Math.max(0, top - 12);
    }
  }, [cursor, run]);
  return (
    <aside className="step-guide" aria-label="Step guide">
      <header className="step-guide-heading">
        <div className="step-guide-title">
          <span className="eyebrow">FLOW GUIDE</span>
          <Button
            variant="ghost"
            aria-label="Close step guide"
            onClick={onClose}
          >
            <X size={17} />
          </Button>
        </div>
        <h2>{run.title}</h2>
        <p>{run.description}</p>
        <small>
          {run.badge} · {run.provenance}
        </small>
        <nav aria-label="Guide navigation">
          <Button
            variant="outline"
            disabled={cursor === 0}
            onClick={() => onStep(cursor - 1)}
          >
            <ArrowLeft size={14} />
            Back
          </Button>
          <Button
            disabled={cursor === run.events.length - 1}
            onClick={() => onStep(cursor + 1)}
          >
            Next step
            <ArrowRight size={14} />
          </Button>
          <span aria-live="polite">
            {cursor + 1} / {run.events.length}
          </span>
        </nav>
      </header>
      <ol className="guide-steps" ref={list} aria-label="Flow steps">
        {run.events.map((step, index) => (
          <li key={step.sequence}>
            <button
              className="guide-step"
              aria-current={index === cursor ? "step" : undefined}
              onClick={() => onStep(index)}
            >
              <span className="guide-number">{index + 1}</span>
              <span>
                <strong>{step.trace.title}</strong>
                <small>{step.trace.body}</small>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <section
        className="guide-details"
        aria-label="Current step details"
        key={`${run.id}:${cursor}`}
      >
        <h3>{event.trace.title}</h3>
        {event.decision && (
          <p className="guide-decision" style={decisionStyle(event.decision)}>
            <strong>{event.decision.label}</strong>
            <br />
            {event.decision.outcome}
          </p>
        )}
        <h4>How data flows</h4>
        {edges.length ? (
          edges.map((edge) => (
            <div className="guide-flow" key={edge.id}>
              <button
                onClick={() => onInspect("message", edge.id)}
                aria-label={`Inspect flow: ${edge.label}`}
              >
                <strong>{edge.label}</strong>
                <span>
                  {byId[edge.source].title} → {byId[edge.target].title}
                </span>
              </button>
              <p>{edge.description}</p>
            </div>
          ))
        ) : (
          <p>No connection trace was provided for this step.</p>
        )}
        <h4>Components and state</h4>
        {ids.length ? (
          ids.map((id) => {
            const snapshot = project.replay?.snapshot?.(id, run, cursor);
            return (
              <div className="guide-component" key={id}>
                <button onClick={() => onInspect("component", id)}>
                  {byId[id].title} <ArrowRight size={12} />
                </button>
                {snapshot?.value != null ? (
                  <details>
                    <summary>State after this step</summary>
                    <p>{snapshot.label}</p>
                    {snapshot.previous && (
                      <>
                        <h5>Before</h5>
                        <pre>{format(snapshot.previous)}</pre>
                      </>
                    )}
                    <h5>After</h5>
                    <pre>{format(snapshot.value)}</pre>
                  </details>
                ) : (
                  <small>
                    {snapshot?.label ?? "No state snapshot provided."}
                  </small>
                )}
              </div>
            );
          })
        ) : (
          <p>No component trace was provided for this step.</p>
        )}
        <details className="guide-payload">
          <summary>Step payload</summary>
          <p>
            Data supplied by the replay adapter. Input/output fields appear when
            recorded.
          </p>
          <pre>{format(event.payload)}</pre>
        </details>
      </section>
    </aside>
  );
}
