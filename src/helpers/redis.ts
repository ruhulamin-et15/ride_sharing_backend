import Redis, { RedisOptions } from "ioredis";
const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
};
const redis = new Redis(redisOptions);
redis.on("connect", () => console.log("✅ Redis connected successfully"));
redis.on("error", (err: any) => console.error("❌ Redis error:", err));
export default redis;
