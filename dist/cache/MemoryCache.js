export class MemoryCache {
    keyToValue = new Map();
    counters = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    async get(key, _options) {
        const stored = this.keyToValue.get(key);
        if (!stored) {
            this.counters.misses++;
            return undefined;
        }
        if (stored.expiresAtEpochMs !== undefined && stored.expiresAtEpochMs <= Date.now()) {
            this.keyToValue.delete(key);
            this.counters.misses++;
            return undefined;
        }
        this.counters.hits++;
        return stored.value;
    }
    async set(key, value, options) {
        const ttlSeconds = options?.ttlSeconds;
        const expiresAtEpochMs = typeof ttlSeconds === 'number' && ttlSeconds > 0
            ? Date.now() + ttlSeconds * 1000
            : undefined;
        this.keyToValue.set(key, { value, expiresAtEpochMs });
        this.counters.sets++;
    }
    async delete(key, _options) {
        const existed = this.keyToValue.delete(key);
        if (existed)
            this.counters.deletes++;
        return existed;
    }
    async clear() {
        this.keyToValue.clear();
    }
    stats() {
        return { ...this.counters };
    }
}
