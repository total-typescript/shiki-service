import { V1Input } from "./schema.js";

export const createCacheKey = (item: V1Input) => {
  const cacheKey = JSON.stringify({
    code: item.code,
    lang: item.lang,
    meta: item.meta,
  });
  return cacheKey;
};
