/** A local teaching model, not ChatGPT's architecture or a distributed implementation. */
export interface Policy {
  requests: number;
  tokens: number;
  requestRefill: number;
  tokenRefill: number;
}
export interface Account {
  requests: number;
  tokens: number;
  at: number;
  reservations: Record<string, number>;
}
export interface Admission {
  allowed: boolean;
  reason: string;
  retryAfter: number | null;
}

/** Refill both independent buckets against an injected, monotonic clock in seconds. */
export function refill(account: Account, policy: Policy, now: number): void {
  const elapsed = Math.max(0, now - account.at);
  account.requests = Math.min(
    policy.requests,
    account.requests + elapsed * policy.requestRefill,
  );
  account.tokens = Math.min(
    policy.tokens,
    account.tokens + elapsed * policy.tokenRefill,
  );
  account.at = Math.max(account.at, now);
}

/** Reserve prompt + maximum output tokens and one request together before inference. */
export function reserve(
  account: Account,
  policy: Policy,
  id: string,
  estimatedTokens: number,
  now: number,
): Admission {
  if (
    !Number.isFinite(estimatedTokens) ||
    estimatedTokens <= 0 ||
    estimatedTokens > policy.tokens
  )
    return {
      allowed: false,
      reason: "Reservation exceeds capacity or is invalid",
      retryAfter: null,
    };
  if (Object.hasOwn(account.reservations, id))
    return {
      allowed: false,
      reason: "Request already reserved",
      retryAfter: null,
    };
  refill(account, policy, now);
  if (account.requests < 1 || account.tokens < estimatedTokens) {
    const wait = Math.max(
      (1 - account.requests) / policy.requestRefill,
      (estimatedTokens - account.tokens) / policy.tokenRefill,
      0,
    );
    return {
      allowed: false,
      reason:
        account.requests < 1
          ? "Request quota exhausted"
          : "Token quota exhausted",
      retryAfter: Math.ceil(wait),
    };
  }
  account.requests -= 1;
  account.tokens -= estimatedTokens;
  Object.defineProperty(account.reservations, id, {
    value: estimatedTokens,
    enumerable: true,
    configurable: true,
    writable: true,
  });
  return {
    allowed: true,
    reason: "Reserved request and tokens",
    retryAfter: 0,
  };
}

/** Actual usage must stay within the reserved maximum; settle once and refund unused tokens. */
export function reconcile(
  account: Account,
  policy: Policy,
  id: string,
  actualTokens: number,
): boolean {
  if (!Object.hasOwn(account.reservations, id)) return false;
  const reserved = account.reservations[id];
  if (reserved === undefined) return false;
  if (
    !Number.isFinite(actualTokens) ||
    actualTokens < 0 ||
    actualTokens > reserved
  )
    throw new Error("Usage outside reservation");
  account.tokens = Math.min(
    policy.tokens,
    account.tokens + reserved - actualTokens,
  );
  delete account.reservations[id];
  return true;
}
