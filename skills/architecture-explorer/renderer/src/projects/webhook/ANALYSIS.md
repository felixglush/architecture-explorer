# Synthetic webhook example

This is a deterministic, in-memory teaching system authored for this explorer.
`webhook.ts` is its complete implementation; it is not extracted from a production
service. Source snapshots are bundled directly from that file at build time.

## Responsibilities and evidence

- Publisher: `simulateWebhook` constructs a `WebhookEvent` with a stable event ID.
- Queue: `simulateWebhook` tracks pending work and one scheduled retry.
- Worker: `simulateWebhook` records attempts and a scripted first response of 503.
- Receiver: `receive` checks the event ID and returns a `Receipt`.
- Ledger: the `Set<string>` used by `receive` records processed IDs.

The producer, delivery service, and consumer are logical teaching boundaries, not
separate deployed processes. Queue and worker source references intentionally point
to the same small simulation function. The receiver and ledger share receive.
Connection descriptions identify their backing call/state operation.

## Walkthrough

Seven steps: enqueue, attempt, 503/requeue, retry, first processing/200, deliberate
redelivery, duplicate acknowledgement/200. Every snapshot is copied after its step,
and the adapter reads only the selected snapshot. Metrics are fixture values.
Only the retry and duplicate-handling steps receive decision highlights.

The retry delay is explanatory; no timer runs. There is no real HTTP, signature
verification, persistent queue/database, retry exhaustion, concurrency protection,
transactional side effect, crash recovery, or production delivery guarantee.
The Set is sufficient only for this single-process example.

## Verification

The browser test follows the complete flow, verifies cursor-bounded metrics/state,
inspects receiver source and input schema, and checks the standalone webhook entry.
The distribution's existing offline test verifies the shared self-contained bundle.
The Pages workflow publishes only dist after tests pass, preserving the existing UI.
