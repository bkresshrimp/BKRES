export interface CacheGetOptions {
	/** bypass memory and fetch from tier 2 only */
	readonly forceTier2?: boolean;
}

export interface CacheSetOptions {
	/** time to live in seconds */
	readonly ttlSeconds?: number;
}

export interface CacheDeleteOptions {
	/** delete from both tiers even if not found in tier 1 */
	readonly forceBothTiers?: boolean;
}

export interface CacheStats {
	readonly hits: number;
	readonly misses: number;
	readonly sets: number;
	readonly deletes: number;
}

export interface Cache<TValue = unknown> {
	get<T = TValue>(key: string, options?: CacheGetOptions): Promise<T | undefined>;
	set<T = TValue>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
	delete(key: string, options?: CacheDeleteOptions): Promise<boolean>;
	clear(): Promise<void>;
	stats(): CacheStats;
}
