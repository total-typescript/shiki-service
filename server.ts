import bodyParser from "body-parser";
import express from "express";
import { Redis } from "ioredis";
import { remark } from "remark";
import remarkHtml, { Options as RemarkHtmlOptions } from "remark-html";
import remarkTwoslash, { Options } from "remark-shiki-twoslash";
import { z } from "zod";

const env = z
  .object({
    AUTHORIZATION: z.string(),
    REDIS_PASSWORD: z.string(),
    REDIS_HOST: z.string(),
    USE_REDIS: z
      .string()
      .optional()
      .transform((v) => v === "true"),
  })
  .parse(process.env);

let redis: Redis;

if (env.USE_REDIS) {
  redis = new Redis({
    family: 6,
    port: 36631,
    password: env.REDIS_PASSWORD,
    host: env.REDIS_HOST,
  });
}

const requiredHeaders = z.object({
  authorization: z.string(),
});

const app = express();
const port = 3000;

app.use(bodyParser.json());

const v1SchemaInput = z.object({
  code: z.string(),
  lang: z.string(),
  meta: z.string().optional().nullable().default(""),
  theme: z.string().optional().default("dark-plus"),
});

app.get("/", (req, res) => {
  res.send("Healthy!");
});

app.post("/v1", async (req, res) => {
  const body = req.body;

  const headers = requiredHeaders.safeParse(req.headers);

  if (!headers.success) {
    return res.status(401).json({ error: headers.error });
  }

  if (headers.data.authorization !== env.AUTHORIZATION) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const input = v1SchemaInput.safeParse(body);

  if (!input.success) {
    return res.status(400).json({ error: input.error });
  }

  const { code, lang, meta, theme } = input.data;

  const cacheKey = JSON.stringify(input.data);

  if (env.USE_REDIS) {
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.send(cached);
    }
  }

  const html = await remark()
    .use(remarkTwoslash.default, {
      theme: theme,
      langs: ["typescript", "javascript", "json", "markdown", "tsx", "jsx"],
    } satisfies Options)
    .use(remarkHtml, { sanitize: false } satisfies RemarkHtmlOptions)
    .process(["```" + lang + " " + meta, code, "```"].join("\n"));

  if (env.USE_REDIS) {
    await redis.set(cacheKey, html.value, "EX", 60 * 60 * 12);
  }

  return res.send(html.value);
});

const start = async () => {
  app.listen(port, () =>
    console.log(`HelloNode app listening on port ${port}!`),
  );
};

start().catch(async (e) => {
  console.log(e);
  process.exit(1);
});
