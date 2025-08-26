import { Cache, CacheDeleteOptions, CacheGetOptions, CacheSetOptions, CacheStats } from './Cache.js';

type StoredValue = {
	value: unknown;
	expiresAtEpochMs?: number;
};

export class MemoryCache implements Cache<unknown> {
	private readonly keyToValue: Map<string, StoredValue> = new Map();
	private counters = { hits: 0, misses: 0, sets: 0, deletes: 0 };

	async get<T = unknown>(key: string, _options?: CacheGetOptions): Promise<T | undefined> {
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
		return stored.value as T;
	}

	async set<T = unknown>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
		const ttlSeconds = options?.ttlSeconds;
		const expiresAtEpochMs = typeof ttlSeconds === 'number' && ttlSeconds > 0
			? Date.now() + ttlSeconds * 1000
			: undefined;
		this.keyToValue.set(key, { value, expiresAtEpochMs });
		this.counters.sets++;
	}

	async delete(key: string, _options?: CacheDeleteOptions): Promise<boolean> {
		const existed = this.keyToValue.delete(key);
		if (existed) this.counters.deletes++;
		return existed;
	}

	async clear(): Promise<void> {
		this.keyToValue.clear();
	}

	stats(): CacheStats {
		return { ...this.counters };
	}
}
