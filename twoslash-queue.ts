import { Redis } from "ioredis";
import { Environment, V1Input } from "./schema.js";
import { remark } from "remark";
import remarkHtml, { Options as RemarkHtmlOptions } from "remark-html";
import remarkTwoslash, { Options } from "remark-shiki-twoslash";
import { QueueItem } from "./types.js";
import { createCacheKey } from "./createCacheKey.js";

const processor = remark()
  .use(remarkTwoslash.default, {
    theme: "github-dark",
    langs: ["typescript", "javascript", "json", "markdown", "tsx", "jsx"],
  } satisfies Options)
  .use(remarkHtml, { sanitize: false } satisfies RemarkHtmlOptions);

export const twoslashQueue = ({
  env,
  redis,
}: {
  env: Environment;
  redis: Redis;
}) => {
  const queue: QueueItem[] = [];

  let state: "running" | "idle" = "idle";

  const _run = async () => {
    console.log(state, queue.length);
    /**
     * If already running, do nothing
     */
    if (state === "running") {
      return;
    }

    const item = queue.shift();

    if (!item) {
      return;
    }

    state = "running";

    try {
      const result = await _executeQueueItem(item);
      item.onDone(result);
    } catch (e) {
      item.onError();
    }

    state = "idle";

    _run();
  };

  const _executeQueueItem = async ({ input }: QueueItem): Promise<string> => {
    const { code, lang, meta, theme } = input;

    const cacheKey = createCacheKey(input);
    if (env.USE_REDIS) {
      const cached = await redis.get(cacheKey);

      if (cached) {
        return cached;
      }
    }

    const html = await processor.process(
      ["```" + lang + " " + meta, code, "```"].join("\n"),
    );

    if (env.USE_REDIS) {
      await redis.set(cacheKey, html.value, "EX", 60 * 60 * 24);
    }

    return html.value.toString();
  };

  const enqueue = (input: V1Input) => {
    return new Promise<string>((resolve, reject) => {
      queue.push({
        input,
        onDone: resolve,
        onError: reject,
      });

      _run();
    });
  };

  return {
    enqueue,
  };
};
