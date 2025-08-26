import { Cache, CacheDeleteOptions, CacheGetOptions, CacheSetOptions, CacheStats } from './Cache.js';
import { MemoryCache } from './MemoryCache.js';
import { RedisCache } from './RedisCache.js';

export type TwoTierCacheOptions = {
	readonly warmMemoryOnRedisHit?: boolean;
};

export class TwoTierCache implements Cache<unknown> {
	private readonly memory: MemoryCache;
	private readonly redis: RedisCache;
	private readonly warmMemoryOnRedisHit: boolean;
	private counters = { hits: 0, misses: 0, sets: 0, deletes: 0 };

	constructor(memory: MemoryCache, redis: RedisCache, options: TwoTierCacheOptions = {}) {
		this.memory = memory;
		this.redis = redis;
		this.warmMemoryOnRedisHit = options.warmMemoryOnRedisHit ?? true;
	}

	async get<T = unknown>(key: string, options?: CacheGetOptions): Promise<T | undefined> {
		if (!options?.forceTier2) {
			const fromMemory = await this.memory.get<T>(key);
			if (fromMemory !== undefined) {
				this.counters.hits++;
				return fromMemory;
			}
		}

		const { value, remainingTtlSeconds } = await this.redis.getWithRemainingTtl<T>(key);
		if (value === undefined) {
			this.counters.misses++;
			return undefined;
		}
		if (this.warmMemoryOnRedisHit) {
			await this.memory.set<T>(key, value, { ttlSeconds: remainingTtlSeconds ?? undefined });
		}
		this.counters.hits++;
		return value;
	}

	async set<T = unknown>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
		await Promise.all([
			this.memory.set<T>(key, value, options),
			this.redis.set<T>(key, value, options),
		]);
		this.counters.sets++;
	}

	async delete(key: string, options?: CacheDeleteOptions): Promise<boolean> {
		const [memDeleted, _] = await Promise.all([
			this.memory.delete(key, options),
			this.redis.delete(key, options),
		]);
		if (memDeleted) this.counters.deletes++;
		return memDeleted;
	}

	async clear(): Promise<void> {
		await Promise.all([this.memory.clear(), this.redis.clear()]);
	}

	stats(): CacheStats {
		return { ...this.counters };
	}
}
