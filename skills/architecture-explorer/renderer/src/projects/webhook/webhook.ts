/** Synthetic, in-memory teaching model. No HTTP, timers, secrets, or durable storage. */
export interface WebhookEvent {
  id: string;
  type: string;
  orderId: string;
}
export interface Receipt {
  status: number;
  duplicate: boolean;
}
export interface DemoState {
  pending: number;
  attempts: number;
  retries: number;
  processed: string[];
  duplicates: number;
  status: string;
}
export interface DemoStep {
  phase: string;
  input: WebhookEvent;
  output: unknown;
  state: DemoState;
}

/** The event ID makes this illustrative receiver idempotent within one process. */
export function receive(event: WebhookEvent, processed: Set<string>): Receipt {
  const duplicate = !claimEvent(event.id, processed);
  return { status: 200, duplicate };
}

export function claimEvent(id: string, processed: Set<string>): boolean {
  if (processed.has(id)) return false;
  processed.add(id);
  return true;
}
export function scheduleRetry(state: DemoState): void {
  state.pending = 1;
  state.retries += 1;
  state.status = "retry scheduled";
}

/** A fake transport fails once, succeeds on retry, then redelivers the same event. */
export function simulateWebhook(): DemoStep[] {
  const event: WebhookEvent = {
    id: "evt_demo_001",
    type: "order.created",
    orderId: "order_demo_001",
  };
  const processed = new Set<string>();
  const state: DemoState = {
    pending: 1,
    attempts: 0,
    retries: 0,
    processed: [],
    duplicates: 0,
    status: "queued",
  };
  const steps: DemoStep[] = [];
  const record = (phase: string, output: unknown) =>
    steps.push({ phase, input: event, output, state: structuredClone(state) });
  record("queued", { accepted: true });
  state.pending = 0;
  state.attempts = 1;
  state.status = "sending";
  record("sending", { attempt: 1 });
  scheduleRetry(state);
  record("retry", {
    status: 503,
    retryAfterSeconds: 2,
    note: "Delay is illustrative; no timer runs.",
  });
  state.pending = 0;
  state.attempts = 2;
  state.status = "sending";
  record("resending", { attempt: 2 });
  const receipt = receive(event, processed);
  state.processed = [...processed];
  state.status = "delivered";
  record("delivered", receipt);
  state.attempts = 3;
  state.status = "redelivering";
  record("redelivering", {
    attempt: 3,
    note: "Synthetic duplicate delivery after success.",
  });
  const duplicate = receive(event, processed);
  if (duplicate.duplicate) state.duplicates += 1;
  state.processed = [...processed];
  state.status = "duplicate acknowledged";
  record("duplicate", duplicate);
  return steps;
}
