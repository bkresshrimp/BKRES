import IORedis from 'ioredis';
export class RedisCache {
    namespace;
    redis;
    counters = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    constructor(options = {}) {
        this.namespace = (options.namespace ?? 'cache') + ':';
        this.redis = options.client ?? (options.url ? new IORedis(options.url) : new IORedis());
    }
    namespaced(key) {
        return this.namespace + key;
    }
    serialize(value, ttlSeconds) {
        const exp = typeof ttlSeconds === 'number' && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined;
        const envelope = { v: value, exp };
        return JSON.stringify(envelope);
    }
    deserialize(raw) {
        if (raw == null)
            return {};
        try {
            const envelope = JSON.parse(raw);
            if (typeof envelope.exp === 'number') {
                const remainingMs = envelope.exp - Date.now();
                return { value: envelope.v, remainingTtlSeconds: remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0 };
            }
            return { value: envelope.v };
        }
        catch {
            return {};
        }
    }
    async get(key, _options) {
        const nkey = this.namespaced(key);
        const raw = await this.redis.get(nkey);
        const { value } = this.deserialize(raw);
        if (value === undefined) {
            this.counters.misses++;
            return undefined;
        }
        this.counters.hits++;
        return value;
    }
    async getWithRemainingTtl(key) {
        const nkey = this.namespaced(key);
        const raw = await this.redis.get(nkey);
        const { value, remainingTtlSeconds } = this.deserialize(raw);
        if (value === undefined) {
            this.counters.misses++;
            return {};
        }
        this.counters.hits++;
        return { value, remainingTtlSeconds };
    }
    async set(key, value, options) {
        const nkey = this.namespaced(key);
        const ttlSeconds = options?.ttlSeconds;
        const payload = this.serialize(value, ttlSeconds);
        if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
            await this.redis.set(nkey, payload, 'EX', ttlSeconds);
        }
        else {
            await this.redis.set(nkey, payload);
        }
        this.counters.sets++;
    }
    async delete(key, _options) {
        const nkey = this.namespaced(key);
        const res = await this.redis.del(nkey);
        if (res > 0)
            this.counters.deletes++;
        return res > 0;
    }
    async clear() {
        const prefix = this.namespace + '*';
        let cursor = '0';
        do {
            const [next, keys] = await this.redis.scan(cursor, 'MATCH', prefix, 'COUNT', 100);
            cursor = next;
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } while (cursor !== '0');
    }
    stats() {
        return { ...this.counters };
    }
}
