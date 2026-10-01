/** Synthetic, single-process URL service. The counter and maps are not durable. */
export interface Link {
  url: string;
  expiresAt: number;
}
export interface Store {
  nextId: number;
  links: Map<string, Link>;
  cache: Map<string, Link>;
  reads: number;
}

export function base62(id: number): string {
  const alphabet =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (!Number.isSafeInteger(id) || id < 0) throw new Error("Invalid counter");
  let code = "";
  do {
    code = alphabet[id % 62] + code;
    id = Math.floor(id / 62);
  } while (id > 0);
  return code;
}

export function shorten(store: Store, url: string, expiresAt: number): string {
  if (!/^https?:\/\//.test(url)) throw new Error("Expected HTTP(S) URL");
  const code = base62(store.nextId++);
  store.links.set(code, { url, expiresAt });
  return code;
}

/** Cache-aside read; the same expiration bound is checked on both paths. */
export function redirect(
  store: Store,
  code: string,
  now: number,
): string | null {
  const cached = store.cache.get(code);
  if (cached && cached.expiresAt > now) return cached.url;
  store.cache.delete(code);
  store.reads++;
  const link = store.links.get(code);
  if (!link || link.expiresAt <= now) return null;
  store.cache.set(code, link);
  return link.url;
}
