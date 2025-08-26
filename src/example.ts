import 'dotenv/config';
import IORedis from 'ioredis';
import { MemoryCache } from './cache/MemoryCache.js';
import { RedisCache } from './cache/RedisCache.js';
import { TwoTierCache } from './cache/TwoTierCache.js';

async function main() {
	const redisUrl = process.env.REDIS_URL || undefined;
	const redisClient = redisUrl ? new IORedis(redisUrl) : new IORedis();
	redisClient.on('error', (err) => console.error('[redis] error:', err.message));

	const memory = new MemoryCache();
	const redis = new RedisCache({ client: redisClient, namespace: process.env.CACHE_NAMESPACE || 'app-cache' });
	const cache = new TwoTierCache(memory, redis);

	console.log('Setting key foo = {bar:42} ttl 5s');
	await cache.set('foo', { bar: 42 }, { ttlSeconds: 5 });

	console.log('Get foo (memory miss -> redis hit -> memory warm)');
	console.log(await cache.get('foo'));

	console.log('Get foo again (memory hit)');
	console.log(await cache.get('foo'));

	console.log('Waiting 6s to observe expiry...');
	await new Promise((r) => setTimeout(r, 6000));
	console.log('Get foo after TTL (should be undefined)');
	console.log(await cache.get('foo'));

	console.log('Stats two-tier:', cache.stats());
	console.log('Stats memory:', memory.stats());
	console.log('Stats redis:', redis.stats());

	await redisClient.quit();
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
