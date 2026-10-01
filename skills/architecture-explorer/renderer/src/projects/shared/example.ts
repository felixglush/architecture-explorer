import { componentBoundary } from "../../core/detail";
import type {
  ArchitectureDocument,
  ArchitectureProject,
  Component,
  Connection,
  ReplayEvent,
  Source,
} from "../../core/types";
export interface TeachingStep {
  title: string;
  body: string;
  nodes: string[];
  edges: string[];
  input: unknown;
  output: unknown;
  state: Record<string, Record<string, unknown>>;
  decision?: { actor: string; label: string; outcome: string };
}
/** Shared authoring support for synthetic fixtures, never imported by the renderer. */
export function teachingExample(input: {
  id: string;
  title: string;
  description: string;
  services: ArchitectureDocument["services"];
  components: Component[];
  connections: Connection[];
  sources: Source[];
  contracts?: ArchitectureDocument["contracts"];
  steps: TeachingStep[];
  views?: ArchitectureDocument["views"];
}): ArchitectureProject {
  const events: ReplayEvent[] = input.steps.map((step, sequence) => ({
    sequence,
    tick: sequence,
    type: `step-${sequence}`,
    payload: { input: step.input, output: step.output },
    raw: step,
    keyEvent: true,
    trace: {
      title: step.title,
      body: step.body,
      nodes: step.nodes,
      edges: step.edges,
      private: false,
    },
    decision: step.decision
      ? {
          ...step.decision,
          tone: "example",
          color: "#287c62",
          background: "#edf8f0",
        }
      : null,
  }));
  const project: ArchitectureProject = {
    document: {
      schemaVersion: 1,
      id: input.id,
      title: input.title,
      version: "1",
      description: input.description,
      modes: [{ id: "default", title: "Synthetic example" }],
      defaults: { view: "all", allView: "all", mode: "default" },
      services: input.services,
      components: input.components,
      connections: input.connections,
      views: input.views ?? [
        {
          id: "all",
          title: input.title,
          description: input.description,
          nodes: input.components.map((c) => c.id),
        },
      ],
      contracts: input.contracts ?? {},
      sources: Object.fromEntries(
        input.sources.map((s) => [`${s.path}:${s.symbol}`, s]),
      ),
      messageKinds: { flow: { label: "Call / data flow", color: "#3568ae" } },
    },
    replay: {
      defaults: { view: "all", cursor: 0 },
      labels: {
        tick: "Step",
        action: "Walk through the example",
        region: "Synthetic walkthrough",
        private: "Internal",
        public: "Synthetic event",
        decisionHelp: "Decisions from the bundled teaching model.",
      },
      runs: [
        {
          id: input.id,
          title: input.title,
          description: input.description,
          provenance: "Synthetic in-memory execution · not production logs",
          badge: "Synthetic example",
          data: input.steps,
          events,
        },
      ],
      snapshot: (id, run, cursor) => {
        const steps = run.data as TeachingStep[],
          value = steps[cursor].state[id];
        return {
          label: value
            ? "Synthetic state after this step."
            : "No independent state is modeled for this component.",
          value: value ?? null,
          ...(value
            ? {
                fields: value,
                previous: cursor > 0 ? steps[cursor - 1].state[id] : undefined,
              }
            : {}),
        };
      },
      recordedIO: (id, run, cursor) => {
        const steps = run.data as TeachingStep[];
        const { members } = componentBoundary(project.document, id);
        for (let i = cursor; i >= 0; i--)
          if (steps[i].nodes.some((node) => members.has(node)))
            return {
              sequence: i,
              tick: i,
              input: steps[i].input,
              output: steps[i].output,
              note: "Synthetic step input/output, not a complete protocol capture.",
            };
        return null;
      },
    },
  };
  return project;
}
export function connection(
  id: string,
  source: string,
  target: string,
  label: string,
  description: string,
): Connection {
  return {
    id,
    source,
    target,
    label,
    description,
    kind: "flow",
    when: "At the corresponding synthetic step.",
    failure:
      "See the source-backed fixture and ANALYSIS.md for modeled failures and limitations.",
  };
}
