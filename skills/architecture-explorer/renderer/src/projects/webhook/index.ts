import { fixtureSource } from "../shared/source";
import code from "./webhook.ts?raw";
import { simulateWebhook, type DemoStep, type DemoState } from "./webhook";
import type { ArchitectureProject, Source, ReplayRun } from "../../core/types";
const path = "src/projects/webhook/webhook.ts";
const ref = (symbol: string) => ({ path, symbol });
const source = (symbol: string, fields: Source["fields"] = []) =>
  fixtureSource(code, path, symbol, fields);
const sources = [
  source("WebhookEvent", [
    { name: "id", type: "string" },
    { name: "type", type: "string" },
    { name: "orderId", type: "string" },
  ]),
  source("Receipt", [
    { name: "status", type: "number" },
    { name: "duplicate", type: "boolean" },
  ]),
  source("receive"),
  source("claimEvent"),
  source("scheduleRetry"),
  source("simulateWebhook"),
];
const steps = simulateWebhook();
const traces: Record<
  string,
  { title: string; body: string; nodes: string[]; edges: string[] }
> = {
  queued: {
    title: "An order event enters the queue",
    body: "Synthetic order.created input is buffered for delivery.",
    nodes: ["publisher", "queue"],
    edges: ["enqueue"],
  },
  sending: {
    title: "First delivery attempt",
    body: "The worker takes the queued event and calls the fake receiver transport.",
    nodes: ["queue", "worker", "receiver"],
    edges: ["dequeue", "send"],
  },
  retry: {
    title: "503 schedules a retry",
    body: "The scripted transport fails. The same event ID is requeued; the two-second delay is illustrative.",
    nodes: ["receiver", "retry-code", "queue"],
    edges: ["response", "retry"],
  },
  resending: {
    title: "Retry sends the same event",
    body: "Attempt two preserves the event ID so the receiver can detect duplicates.",
    nodes: ["queue", "worker", "receiver"],
    edges: ["dequeue", "send"],
  },
  delivered: {
    title: "Receiver processes the event once",
    body: "The in-memory receiver adds the event ID to its ledger and returns 200.",
    nodes: ["receive-code", "claim-code", "worker"],
    edges: ["deduplicate", "response"],
  },
  redelivering: {
    title: "A duplicate arrives",
    body: "The fixture deliberately redelivers the successful event to demonstrate at-least-once delivery.",
    nodes: ["worker", "receiver"],
    edges: ["send"],
  },
  duplicate: {
    title: "Duplicate acknowledged without reprocessing",
    body: "The event ID is already in the ledger. The receiver returns 200 with duplicate=true; processed count stays one.",
    nodes: ["receive-code", "claim-code", "worker"],
    edges: ["deduplicate", "response"],
  },
};
const run: ReplayRun = {
  id: "webhook-retry",
  title: "Synthetic webhook · retry and duplicate",
  description:
    "Deterministic in-memory fixture; no live webhook system or network traffic.",
  provenance: "Synthetic fixture · local model execution, not production logs",
  badge: "Synthetic example",
  data: steps,
  events: steps.map((step, sequence) => ({
    sequence,
    tick: sequence,
    type: step.phase,
    payload: { input: step.input, output: step.output },
    raw: step,
    keyEvent: true,
    trace: { ...traces[step.phase], private: false },
    decision:
      step.phase === "retry" || step.phase === "duplicate"
        ? {
            actor: step.phase === "retry" ? "retry-code" : "receive-code",
            tone: step.phase === "retry" ? "warning" : "success",
            label:
              step.phase === "retry"
                ? "Worker · Retry"
                : "Receiver · Duplicate",
            outcome: step.state.status,
            color: step.phase === "retry" ? "#9a650d" : "#287c62",
            background: "#f7f5e8",
          }
        : null,
  })),
};
function stateAt(run: ReplayRun, cursor: number): DemoState {
  return (run.data as DemoStep[])[cursor].state;
}
function projectState(id: string, state: DemoState): Record<string, unknown> {
  id =
    (
      {
        "retry-code": "worker",
        "receive-code": "receiver",
        "claim-code": "ledger",
      } as Record<string, string>
    )[id] ?? id;
  if (id === "queue") return { pending: state.pending, retries: state.retries };
  if (id === "worker")
    return { attempts: state.attempts, status: state.status };
  if (id === "ledger") return { processedIds: state.processed };
  if (id === "receiver")
    return { processed: state.processed.length, duplicates: state.duplicates };
  return { eventId: "evt_demo_001" };
}
export const webhookProject: ArchitectureProject = {
  document: {
    schemaVersion: 1,
    id: "webhook-example",
    title: "WEBHOOK DELIVERY",
    version: "1",
    description:
      "A synthetic webhook system: retry a failed delivery and suppress duplicate processing.",
    modes: [{ id: "default", title: "Synthetic delivery" }],
    defaults: { view: "all", allView: "all", mode: "default" },
    services: [
      {
        id: "producer",
        title: "Event producer",
        subtitle: "Synthetic input",
        color: "#3568ae",
      },
      {
        id: "delivery",
        title: "Delivery service",
        subtitle: "In-memory queue and scripted transport",
        color: "#9a650d",
      },
      {
        id: "consumer",
        title: "Webhook consumer",
        subtitle: "Receiver and in-memory ledger",
        color: "#287c62",
      },
    ],
    views: [
      {
        id: "all",
        title: "Webhook delivery",
        description: "Enqueue → send → retry → process once",
        nodes: [
          "publisher",
          "queue",
          "worker",
          "receiver",
          "ledger",
          "receive-code",
          "claim-code",
          "retry-code",
        ],
      },
      {
        id: "delivery",
        title: "Delivery and retries",
        description: "Queue ownership and transport responses",
        nodes: ["queue", "worker", "receiver", "receive-code", "retry-code"],
      },
      {
        id: "receipt",
        title: "Idempotent receiver",
        description: "Duplicate detection and acknowledgement",
        nodes: ["worker", "receiver", "ledger", "receive-code", "claim-code"],
      },
    ],
    components: [
      {
        id: "publisher",
        title: "Event publisher",
        service: "producer",
        icon: "layers",
        summary: "Create a synthetic order event.",
        state: "Owns the example input.",
        sources: [ref("WebhookEvent")],
        stateTypes: [],
      },
      {
        id: "queue",
        detail: "implementation" as const,
        parent: "worker",
        title: "Delivery queue",
        service: "delivery",
        icon: "layers",
        summary: "Buffer the event and schedule one retry.",
        state: "Owns pending work and retry count in the fixture.",
        sources: [ref("simulateWebhook")],
        stateTypes: [],
      },
      {
        id: "worker",
        title: "Delivery worker",
        service: "delivery",
        icon: "gear",
        summary: "Send, inspect the response, and retry.",
        state: "Owns attempt count and delivery status.",
        sources: [ref("simulateWebhook")],
        stateTypes: [],
      },
      {
        id: "receiver",
        title: "Webhook receiver",
        service: "consumer",
        icon: "code",
        summary: "Acknowledge events and suppress duplicates.",
        state: "Uses the ledger; counts duplicate receipts in the fixture.",
        sources: [ref("receive")],
        stateTypes: [],
      },
      {
        id: "ledger",
        detail: "implementation" as const,
        parent: "receiver",
        title: "Idempotency ledger",
        service: "consumer",
        icon: "database",
        summary: "Remember which event IDs were processed.",
        state: "In-memory Set of processed IDs; not a durable database.",
        sources: [ref("receive")],
        stateTypes: [],
      },
      ...[
        ["receive-code", "receive", "receiver", "consumer"],
        ["claim-code", "claimEvent", "ledger", "consumer"],
        ["retry-code", "scheduleRetry", "worker", "delivery"],
      ].map(([id, title, parent, service]) => ({
        id,
        title,
        parent,
        service,
        detail: "code" as const,
        icon: "code",
        summary: `Execute ${title} in the teaching fixture.`,
        state: "Uses its owning component's state.",
        sources: [ref(title)],
        stateTypes: [],
      })),
    ].map((c) => ({ ...c, responsibilities: [c.summary] })),
    contracts: { WebhookEvent: ref("WebhookEvent"), Receipt: ref("Receipt") },
    sources: Object.fromEntries(sources.map((s) => [`${path}:${s.symbol}`, s])),
    messageKinds: {
      event: { label: "Event", color: "#3568ae" },
      response: { label: "HTTP response", color: "#287c62" },
      state: { label: "State access", color: "#9a650d" },
    },
    connections: [
      {
        id: "enqueue",
        source: "publisher",
        target: "queue",
        label: "Enqueue event",
        kind: "event",
        contract: "WebhookEvent",
        description:
          "simulateWebhook buffers its synthetic order.created event.",
      },
      {
        id: "dequeue",
        source: "queue",
        target: "worker",
        label: "Take delivery",
        kind: "event",
        contract: "WebhookEvent",
        description: "simulateWebhook removes pending work before an attempt.",
      },
      {
        id: "send",
        source: "worker",
        target: "receive-code",
        label: "POST webhook",
        kind: "event",
        contract: "WebhookEvent",
        description:
          "simulateWebhook uses a fake transport, then calls receive. No real HTTP request is sent.",
      },
      {
        id: "response",
        source: "receive-code",
        target: "worker",
        label: "503 / 200",
        kind: "response",
        description:
          "A scripted 503 triggers retry; receive returns a 200 Receipt on subsequent attempts.",
      },
      {
        id: "retry",
        source: "retry-code",
        target: "queue",
        label: "Retry same ID",
        kind: "event",
        contract: "WebhookEvent",
        description:
          "simulateWebhook requeues the same input once; retryAfterSeconds is explanatory, not a real timer.",
      },
      {
        id: "deduplicate",
        source: "receive-code",
        target: "claim-code",
        label: "Check / store ID",
        kind: "state",
        description:
          "claimEvent checks Set.has and only adds a new ID. No separate transaction or persistent store is modeled.",
      },
    ].map((e) => ({
      ...e,
      when: "At the corresponding synthetic replay step.",
      failure:
        "This fixture demonstrates one transient 503. Retry exhaustion, signatures, concurrency, crash recovery and real network failures are outside its scope.",
      ...(e.kind === "event" ? { example: steps[0].input } : {}),
    })),
  },
  replay: {
    runs: [run],
    labels: {
      tick: "Step",
      action: "Walk through a webhook",
      region: "Webhook walkthrough",
      private: "Internal",
      public: "Synthetic event",
      decisionHelp: "Highlights retry and duplicate-handling decisions.",
    },
    defaults: { view: "all", component: "worker", cursor: 0 },
    snapshot: (id, run, cursor) => ({
      label: "Synthetic in-memory state after this step.",
      value: projectState(id, stateAt(run, cursor)),
      fields: projectState(id, stateAt(run, cursor)),
      ...(cursor > 0
        ? { previous: projectState(id, stateAt(run, cursor - 1)) }
        : {}),
    }),
    metrics: (run, cursor) => {
      const s = stateAt(run, cursor);
      return {
        title: "SYNTHETIC STATE",
        note: "Derived from the bundled teaching model.",
        values: [
          { id: "attempts", title: "Attempts", value: s.attempts },
          {
            id: "processed",
            title: "Processed once",
            value: s.processed.length,
          },
          {
            id: "duplicates",
            title: "Duplicates ignored",
            value: s.duplicates,
          },
        ],
        flags: [],
      };
    },
  },
};
