## Two-tier cache (Memory + Redis) in Node.js + TypeScript

- Memory cache: `src/cache/MemoryCache.ts`
- Redis cache: `src/cache/RedisCache.ts`
- Two-tier orchestrator: `src/cache/TwoTierCache.ts`
- Example usage: `src/example.ts`

### Quick start

1) Install deps

```bash
npm install
```

2) Set environment (optional)

Copy `.env.example` to `.env` and adjust values:

- `REDIS_URL` e.g. `redis://localhost:6379`
- `CACHE_NAMESPACE` e.g. `app-cache`

3) Run in dev (requires a Redis server reachable by `REDIS_URL` or default localhost)

```bash
npm run dev
```

4) Build + run

```bash
npm run build
npm start
```

### API

- `MemoryCache` implements an in-process cache with TTL per entry.
- `RedisCache` stores JSON-serialized envelopes with optional TTL and namespace.
- `TwoTierCache` reads from memory first, then Redis; warms memory on Redis hit.

All caches implement `Cache<T>` interface in `src/cache/Cache.ts`.
