# Synthetic URL shortener

Reference: [Hello Interview — Design Bitly](https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly).
The article informs counter-based unique IDs, base62 encoding and cache-aside
redirect lookups. The fixture is original single-process teaching code, using
in-memory maps and a local counter instead of distributed Redis or a database.

Overview: browser and URL service (2 nodes).
Implementation: counter, link database and redirect cache (5 total).
Code: actual shorten, base62 and redirect functions from shortener.ts (8 total).
Service boundaries are logical ownership boundaries, not separate deployments.

The adapter executes four operations and copies their resulting state: create,
cache miss, cache hit, expired link. The hit avoids a database read. Both paths
check the same expiration bound. HTTP 302 and 404 are synthetic output envelopes;
there is no server. The database-to-cache arrow denotes data copied by redirect,
not a database process pushing a message.

The counter is unique only within this process and safe integer range. Storage
is not durable; there is no distributed ID allocation, eviction policy, security
filter, custom alias, analytics or real URL validation beyond an HTTP(S) prefix.

Tests check uniqueness, base62 encoding, cache behavior, expiration and each detail
level of the self-contained artifact with networking disabled.
