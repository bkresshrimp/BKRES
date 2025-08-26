import { Cache, CacheDeleteOptions, CacheGetOptions, CacheSetOptions, CacheStats } from './Cache.js';
import IORedis, { Redis } from 'ioredis';

export type RedisCacheOptions = {
	readonly namespace?: string;
	readonly client?: Redis;
	readonly url?: string;
};

type StoredEnvelope = {
	v: unknown;
	exp?: number; // epoch ms
};

export class RedisCache implements Cache<unknown> {
	private readonly namespace: string;
	private readonly redis: Redis;
	private counters = { hits: 0, misses: 0, sets: 0, deletes: 0 };

	constructor(options: RedisCacheOptions = {}) {
		this.namespace = (options.namespace ?? 'cache') + ':';
		this.redis = options.client ?? (options.url ? new IORedis(options.url) : new IORedis());
	}

	private namespaced(key: string): string {
		return this.namespace + key;
	}

	private serialize(value: unknown, ttlSeconds?: number): string {
		const exp = typeof ttlSeconds === 'number' && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined;
		const envelope: StoredEnvelope = { v: value, exp };
		return JSON.stringify(envelope);
	}

	private deserialize<T>(raw: string | null): { value?: T; remainingTtlSeconds?: number } {
		if (raw == null) return {};
		try {
			const envelope = JSON.parse(raw) as StoredEnvelope;
			if (typeof envelope.exp === 'number') {
				const remainingMs = envelope.exp - Date.now();
				return { value: envelope.v as T, remainingTtlSeconds: remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0 };
			}
			return { value: envelope.v as T };
		} catch {
			return {};
		}
	}

	async get<T = unknown>(key: string, _options?: CacheGetOptions): Promise<T | undefined> {
		const nkey = this.namespaced(key);
		const raw = await this.redis.get(nkey);
		const { value } = this.deserialize<T>(raw);
		if (value === undefined) {
			this.counters.misses++;
			return undefined;
		}
		this.counters.hits++;
		return value;
	}

	async getWithRemainingTtl<T = unknown>(key: string): Promise<{ value?: T; remainingTtlSeconds?: number }> {
		const nkey = this.namespaced(key);
		const raw = await this.redis.get(nkey);
		const { value, remainingTtlSeconds } = this.deserialize<T>(raw);
		if (value === undefined) {
			this.counters.misses++;
			return {};
		}
		this.counters.hits++;
		return { value, remainingTtlSeconds };
	}

	async set<T = unknown>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
		const nkey = this.namespaced(key);
		const ttlSeconds = options?.ttlSeconds;
		const payload = this.serialize(value, ttlSeconds);
		if (typeof ttlSeconds === 'number' && ttlSeconds > 0) {
			await this.redis.set(nkey, payload, 'EX', ttlSeconds);
		} else {
			await this.redis.set(nkey, payload);
		}
		this.counters.sets++;
	}

	async delete(key: string, _options?: CacheDeleteOptions): Promise<boolean> {
		const nkey = this.namespaced(key);
		const res = await this.redis.del(nkey);
		if (res > 0) this.counters.deletes++;
		return res > 0;
	}

	async clear(): Promise<void> {
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

	stats(): CacheStats {
		return { ...this.counters };
	}
}
