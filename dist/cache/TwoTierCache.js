export class TwoTierCache {
    memory;
    redis;
    warmMemoryOnRedisHit;
    counters = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    constructor(memory, redis, options = {}) {
        this.memory = memory;
        this.redis = redis;
        this.warmMemoryOnRedisHit = options.warmMemoryOnRedisHit ?? true;
    }
    async get(key, options) {
        if (!options?.forceTier2) {
            const fromMemory = await this.memory.get(key);
            if (fromMemory !== undefined) {
                this.counters.hits++;
                return fromMemory;
            }
        }
        const { value, remainingTtlSeconds } = await this.redis.getWithRemainingTtl(key);
        if (value === undefined) {
            this.counters.misses++;
            return undefined;
        }
        if (this.warmMemoryOnRedisHit) {
            await this.memory.set(key, value, { ttlSeconds: remainingTtlSeconds ?? undefined });
        }
        this.counters.hits++;
        return value;
    }
    async set(key, value, options) {
        await Promise.all([
            this.memory.set(key, value, options),
            this.redis.set(key, value, options),
        ]);
        this.counters.sets++;
    }
    async delete(key, options) {
        const [memDeleted, _] = await Promise.all([
            this.memory.delete(key, options),
            this.redis.delete(key, options),
        ]);
        if (memDeleted)
            this.counters.deletes++;
        return memDeleted;
    }
    async clear() {
        await Promise.all([this.memory.clear(), this.redis.clear()]);
    }
    stats() {
        return { ...this.counters };
    }
}
