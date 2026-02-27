// lib/redis.ts
import IORedis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT
  ? parseInt(process.env.REDIS_PORT, 10)
  : 6379;

export const redis = new IORedis({
  host: REDIS_HOST,
  port: REDIS_PORT,
});
