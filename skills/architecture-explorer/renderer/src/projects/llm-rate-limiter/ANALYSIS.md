# Synthetic LLM rate limiter

Reference: [Hello Interview — Distributed Rate Limiter](https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-rate-limiter).
The article informs token-bucket capacity, refill, burst admission and the need for
shared, atomic quota updates across gateways. This fixture uses one synchronous
process instead of implementing Redis or distributed atomicity.

The original LLM adaptation reserves prompt plus maximum output tokens before
inference, alongside one request. Rejection consumes neither budget. Actual usage
refunds unused tokens exactly once. The model response is a fixed synthetic number,
not an API call, tokenizer, or claim about ChatGPT's implementation.

Overview: client, admission gateway, fake model service (3 nodes).
Implementation: policy, quota buckets, outstanding reservations (6 total).
Code: actual reserve, refill and reconcile functions from limiter.ts (9 total).
Every code node links to its build-time source slice. The adapter executes those
functions to capture immutable snapshots, using an injected clock in seconds.

The seven-step replay demonstrates admission, fake inference, token rejection,
settlement, a successful retry, request rejection and admission after refill.
Policy capacities and refill rates are assumed positive. The account represents
one already-selected tenant/model quota. There is no networking, persistence,
concurrent workers, failure recovery, reservation timeout or policy reconfiguration.
A production system needs atomic shared storage, clock and outage policy, and a
settlement strategy for interrupted streams and missing usage reports.

Tests check rejection preserves budgets, retry delay, capacity bounds, single
settlement, and replay at every detail level in the offline HTML artifact.
