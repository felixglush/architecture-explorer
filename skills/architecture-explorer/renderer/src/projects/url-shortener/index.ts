import code from "./shortener.ts?raw";
import { shorten, redirect, type Store } from "./shortener";
import { fixtureSource } from "../shared/source";
import {
  teachingExample,
  connection,
  type TeachingStep,
} from "../shared/example";
import type { Component } from "../../core/types";
const path = "src/projects/url-shortener/shortener.ts";
const store: Store = {
  nextId: 62,
  links: new Map(),
  cache: new Map(),
  reads: 0,
};
const steps: TeachingStep[] = [];
function record(
  title: string,
  body: string,
  nodes: string[],
  edges: string[],
  input: unknown,
  output: unknown,
  label: string,
) {
  steps.push({
    title,
    body,
    nodes,
    edges,
    input,
    output,
    state: structuredClone({
      service: {
        stored: store.links.size,
        cacheEntries: store.cache.size,
        databaseReads: store.reads,
      },
      counter: { nextId: store.nextId },
      database: { links: Object.fromEntries(store.links) },
      cache: { entries: Object.fromEntries(store.cache) },
    }),
    decision: { actor: "redirect", label, outcome: title },
  });
}
const shortCode = shorten(store, "https://example.com/articles/design", 10);
record(
  "Create a short link",
  "The local unique counter 62 becomes base62 code 10 and is stored with expiration at time 10.",
  ["client", "shorten", "base62", "counter", "database"],
  ["create", "allocate", "encode", "write"],
  { url: "https://example.com/articles/design", expiresAt: 10 },
  { shortCode },
  "Service · Created",
);
steps[0].decision = {
  actor: "shorten",
  label: "Service · Created",
  outcome: "Stored one link",
};
let url = redirect(store, shortCode, 0);
record(
  "Cache miss loads the database",
  "The first redirect misses the cache, reads the stored link, then fills the cache.",
  ["client", "redirect", "cache", "database"],
  ["visit", "lookup", "read", "fill"],
  { shortCode, now: 0 },
  { status: 302, location: url },
  "Redirect · Cache miss",
);
url = redirect(store, shortCode, 1);
record(
  "Cache hit avoids a database read",
  "A second redirect uses the unexpired cache entry; database read count stays one.",
  ["client", "redirect", "cache"],
  ["visit", "lookup"],
  { shortCode, now: 1 },
  { status: 302, location: url },
  "Redirect · Cache hit",
);
url = redirect(store, shortCode, 11);
record(
  "Expired link is not redirected",
  "The cache entry is expired and removed. The database record is also expired, so return a synthetic 404.",
  ["client", "redirect", "cache", "database"],
  ["visit", "lookup", "read"],
  { shortCode, now: 11 },
  { status: 404, location: url },
  "Redirect · Expired",
);
const nodes: Component[] = [
  {
    id: "client",
    title: "Browser / client",
    service: "client",
    summary: "Create and visit a short link.",
    state: "Owns input and resulting redirect.",
    sources: [],
  },
  {
    id: "service",
    title: "URL service",
    service: "backend",
    summary: "Create codes and resolve valid links.",
    state: "Owns the local link store and cache.",
    sources: [
      { path, symbol: "shorten" },
      { path, symbol: "redirect" },
    ],
  },
  {
    id: "counter",
    title: "Unique counter",
    service: "backend",
    detail: "implementation",
    parent: "service",
    summary: "Allocate the next local ID.",
    state: "Next monotonically increasing local integer.",
    sources: [{ path, symbol: "Store" }],
  },
  {
    id: "database",
    title: "Link database",
    service: "backend",
    detail: "implementation",
    parent: "service",
    summary: "Store code → URL and expiry.",
    state: "In-memory authoritative map in this fixture.",
    sources: [{ path, symbol: "Store" }],
  },
  {
    id: "cache",
    title: "Redirect cache",
    service: "backend",
    detail: "implementation",
    parent: "service",
    summary: "Keep recently resolved, unexpired links.",
    state: "Cache-aside map; expiration matches the stored record.",
    sources: [{ path, symbol: "Store" }],
  },
  {
    id: "shorten",
    title: "shorten()",
    service: "backend",
    detail: "code",
    parent: "service",
    summary: "Allocate an ID, encode it, and save the link.",
    state: "Mutates the counter and link map.",
    sources: [{ path, symbol: "shorten" }],
  },
  {
    id: "base62",
    title: "base62()",
    service: "backend",
    detail: "code",
    parent: "counter",
    summary: "Encode an integer into a compact code.",
    state: "Pure function; no independent state.",
    sources: [{ path, symbol: "base62" }],
  },
  {
    id: "redirect",
    title: "redirect()",
    service: "backend",
    detail: "code",
    parent: "service",
    summary: "Check cache, then storage, enforcing expiration.",
    state: "May update cache and database read count.",
    sources: [{ path, symbol: "redirect" }],
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
export const shortenerProject = teachingExample({
  id: "url-shortener",
  title: "URL SHORTENER",
  description:
    "Synthetic short-code creation and cache-aside redirects with expiration.",
  services: [
    {
      id: "client",
      title: "Browser",
      subtitle: "Synthetic requests",
      color: "#3568ae",
    },
    {
      id: "backend",
      title: "URL service",
      subtitle: "Logical modules in one process",
      color: "#287c62",
    },
  ],
  components: nodes,
  sources: ["Link", "Store", "base62", "shorten", "redirect"].map((s) =>
    fixtureSource(code, path, s),
  ),
  steps,
  connections: [
    connection(
      "create",
      "client",
      "shorten",
      "Create link",
      "The fixture invokes shorten with a URL and expiration.",
    ),
    connection(
      "allocate",
      "shorten",
      "counter",
      "Next ID",
      "shorten increments the store's nextId.",
    ),
    connection(
      "encode",
      "shorten",
      "base62",
      "Encode ID",
      "shorten calls base62 with the allocated ID.",
    ),
    connection(
      "write",
      "shorten",
      "database",
      "Save link",
      "shorten stores the mapping in links.",
    ),
    connection(
      "visit",
      "client",
      "redirect",
      "Resolve code",
      "The fixture invokes redirect and models a 302 or 404 response.",
    ),
    connection(
      "lookup",
      "redirect",
      "cache",
      "Read / expire cached link",
      "redirect first checks cache expiration, then removes stale entries.",
    ),
    connection(
      "read",
      "redirect",
      "database",
      "Load mapping",
      "redirect reads authoritative links only after a cache miss or expiration.",
    ),
    connection(
      "fill",
      "database",
      "cache",
      "Cache valid mapping",
      "redirect copies the fetched unexpired Link to the cache; the database does not push updates.",
    ),
  ],
});
