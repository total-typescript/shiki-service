import { V1Input } from "./schema.js";

// Change this when you want to manually bust the cache
const CACHE_BUSTER = "v1";

export const createCacheKey = (item: V1Input) => {
  const cacheKey = JSON.stringify({
    code: item.code,
    lang: item.lang,
    meta: item.meta,
    _key: CACHE_BUSTER,
  });
  return cacheKey;
};
