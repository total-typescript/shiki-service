import { Redis } from "ioredis";
import { env } from "./env.js";

export let redis: Redis = {} as any;

if (env.USE_REDIS) {
  redis = new Redis({
    family: 6,
    port: 6379,
    password: env.REDIS_PASSWORD,
    host: env.REDIS_HOST,
  });
}
