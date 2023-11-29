import { V1Input } from "./schema.js";

// Change this whenever you want to manually bust the cache,
// for instance when changing TS versions
export const CACHE_BUSTER = "2023-11-29";

export const createCacheKey = (item: V1Input) => {
  const cacheKey =
    JSON.stringify({
      code: item.code,
      lang: item.lang,
      meta: item.meta,
    }) + CACHE_BUSTER;
  return cacheKey;
};
