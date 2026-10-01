import code from "./limiter.ts?raw";
import { reserve, reconcile, type Account, type Policy } from "./limiter";
import { fixtureSource } from "../shared/source";
import {
  teachingExample,
  connection,
  type TeachingStep,
} from "../shared/example";
import type { Component } from "../../core/types";
const path = "src/projects/llm-rate-limiter/limiter.ts";
const policy: Policy = {
  requests: 2,
  tokens: 100,
  requestRefill: 1,
  tokenRefill: 10,
};
const account: Account = { requests: 2, tokens: 100, at: 0, reservations: {} };
const steps: TeachingStep[] = [];
function record(
  title: string,
  body: string,
  nodes: string[],
  edges: string[],
  input: unknown,
  output: unknown,
  label?: string,
) {
  const buckets = {
    requests: account.requests,
    tokens: account.tokens,
    at: account.at,
  };
  steps.push({
    title,
    body,
    nodes,
    edges,
    input,
    output,
    state: structuredClone({
      limiter: {
        ...buckets,
        inFlight: Object.keys(account.reservations).length,
      },
      buckets,
      reservations: { held: account.reservations },
      policy: { ...policy },
    }),
    ...(label
      ? {
          decision: {
            actor: "reserve",
            label,
            outcome: JSON.stringify(output),
          },
        }
      : {}),
  });
}
let result = reserve(account, policy, "req-1", 80, 0);
record(
  "Reserve before inference",
  "20 prompt tokens + up to 60 output tokens reserve 80 tokens and one request.",
  ["client", "reserve", "refill", "buckets", "reservations"],
  ["request", "read-buckets", "refill-call", "hold"],
  { requestId: "req-1", prompt: 20, maxOutput: 60 },
  result,
  "Limiter · Allow",
);
record(
  "Run the admitted request",
  "Only an allowed request reaches the synthetic model worker. No real model is called.",
  ["limiter", "model"],
  ["inference"],
  { requestId: "req-1", reserved: 80 },
  { actualTokens: 50 },
);
result = reserve(account, policy, "req-2", 40, 0);
record(
  "Reject a token-heavy request",
  "A request slot remains, but only 20 tokens remain. No quota is deducted on rejection.",
  ["client", "reserve", "buckets"],
  ["request", "read-buckets"],
  { requestId: "req-2", estimatedTokens: 40 },
  result,
  "Limiter · Reject",
);
const settled = reconcile(account, policy, "req-1", 50);
record(
  "Refund unused output budget",
  "The first request used 50 of its 80 reserved tokens. Refund 30; a second settlement is a no-op.",
  ["model", "reconcile", "reservations", "buckets"],
  ["usage", "settle", "refund"],
  { requestId: "req-1", actualTokens: 50 },
  { settled, refunded: 30 },
);
result = reserve(account, policy, "req-2", 40, 0);
record(
  "Admit after reconciliation",
  "40 tokens now fit; this consumes the final request slot.",
  ["client", "reserve", "buckets", "reservations"],
  ["request", "read-buckets", "hold"],
  { requestId: "req-2", estimatedTokens: 40 },
  result,
  "Limiter · Allow",
);
result = reserve(account, policy, "req-3", 5, 0);
record(
  "Reject on request count",
  "10 tokens remain, but there are no request slots. Token budget alone is not sufficient.",
  ["client", "reserve", "buckets"],
  ["request", "read-buckets"],
  { requestId: "req-3", estimatedTokens: 5 },
  result,
  "Limiter · Reject",
);
result = reserve(account, policy, "req-3", 5, 2);
record(
  "Refill permits a later request",
  "Two logical seconds refill both buckets up to capacity. The clock is injected; no timer runs.",
  ["client", "reserve", "refill", "buckets", "reservations"],
  ["request", "refill-call", "read-buckets", "hold"],
  { requestId: "req-3", estimatedTokens: 5, now: 2 },
  result,
  "Limiter · Allow",
);
const nodes: Component[] = [
  {
    id: "client",
    title: "Chat client",
    service: "client",
    summary: "Submit a prompt and output bound.",
    state: "Owns request input.",
    sources: [],
  },
  {
    id: "limiter",
    title: "LLM admission",
    service: "gateway",
    summary: "Reserve request and token budget before inference.",
    state: "Owns quota decisions and reservations.",
    sources: [{ path, symbol: "reserve" }],
  },
  {
    id: "model",
    title: "Inference worker",
    service: "model",
    summary: "Report synthetic usage for admitted work.",
    state: "No model state is simulated.",
    sources: [],
  },
  {
    id: "policy",
    title: "Quota policy",
    service: "gateway",
    detail: "implementation",
    parent: "limiter",
    summary: "Configure capacities and refill rates.",
    state: "Requests and tokens per logical second.",
    sources: [{ path, symbol: "Policy" }],
  },
  {
    id: "buckets",
    title: "Quota buckets",
    service: "gateway",
    detail: "implementation",
    parent: "limiter",
    summary: "Track request and token balance together.",
    state: "Local account scoped to one tenant/model pair.",
    sources: [{ path, symbol: "Account" }],
  },
  {
    id: "reservations",
    title: "Usage reservations",
    service: "gateway",
    detail: "implementation",
    parent: "limiter",
    summary: "Hold tokens until actual usage is known.",
    state: "Request ID to reserved token count.",
    sources: [{ path, symbol: "Account" }],
  },
  {
    id: "reserve",
    title: "reserve()",
    service: "gateway",
    detail: "code",
    parent: "limiter",
    summary: "Refill, check both quotas, then deduct together.",
    state: "Mutates buckets and reservations.",
    sources: [{ path, symbol: "reserve" }],
  },
  {
    id: "refill",
    title: "refill()",
    service: "gateway",
    detail: "code",
    parent: "buckets",
    summary: "Replenish quotas with a monotonic clock.",
    state: "Updates balances and last-refill timestamp.",
    sources: [{ path, symbol: "refill" }],
  },
  {
    id: "reconcile",
    title: "reconcile()",
    service: "gateway",
    detail: "code",
    parent: "reservations",
    summary: "Refund unused budget exactly once.",
    state: "Consumes the reservation and updates tokens.",
    sources: [{ path, symbol: "reconcile" }],
  },
].map(
  (c) =>
    ({
      ...c,
      icon: "code",
      responsibilities: [c.summary],
      stateTypes: [],
    }) as Component,
);
export const rateLimiterProject = teachingExample({
  id: "llm-rate-limiter",
  title: "LLM RATE LIMITER",
  description:
    "Synthetic admission control for a ChatGPT-like service; not OpenAI's implementation.",
  services: [
    {
      id: "client",
      title: "Client",
      subtitle: "Synthetic requests",
      color: "#3568ae",
    },
    {
      id: "gateway",
      title: "Admission gateway",
      subtitle: "Single-process teaching model",
      color: "#9a650d",
    },
    {
      id: "model",
      title: "Model service",
      subtitle: "Fake usage; no model calls",
      color: "#287c62",
    },
  ],
  components: nodes,
  sources: [
    "Policy",
    "Account",
    "Admission",
    "reserve",
    "refill",
    "reconcile",
  ].map((s) => fixtureSource(code, path, s)),
  steps,
  connections: [
    connection(
      "request",
      "client",
      "reserve",
      "Request + token estimate",
      "reserve receives a request ID, estimated total tokens and injected time.",
    ),
    connection(
      "policy",
      "reserve",
      "policy",
      "Read limits",
      "reserve and refill use the Policy capacities and rates.",
    ),
    connection(
      "read-buckets",
      "reserve",
      "buckets",
      "Check / deduct quotas",
      "reserve checks both balances before deducting either in this synchronous model.",
    ),
    connection(
      "refill-call",
      "reserve",
      "refill",
      "Refill",
      "reserve calls refill before testing the balances.",
    ),
    connection(
      "hold",
      "reserve",
      "reservations",
      "Hold token budget",
      "reserve stores the admitted request's estimated usage.",
    ),
    connection(
      "inference",
      "limiter",
      "model",
      "Admitted work",
      "The fixture only simulates inference after an allowed admission.",
    ),
    connection(
      "usage",
      "model",
      "reconcile",
      "Actual usage",
      "The fixture supplies synthetic actualTokens to reconcile.",
    ),
    connection(
      "settle",
      "reconcile",
      "reservations",
      "Consume reservation",
      "reconcile removes a reservation once settled.",
    ),
    connection(
      "refund",
      "reconcile",
      "buckets",
      "Refund unused tokens",
      "reconcile restores reserved minus actual usage, capped at bucket capacity.",
    ),
  ],
});
