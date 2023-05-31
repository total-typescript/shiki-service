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
    REDIS_URL: z.string(),
  })
  .parse(process.env);

const redis = new Redis(env.REDIS_URL);

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

  const cached = await redis.get(cacheKey);

  console.log("cached", cached);

  if (cached) {
    return res.send(cached);
  }

  const html = await remark()
    .use(remarkTwoslash.default, {
      theme: theme,
      langs: ["typescript", "javascript", "json", "markdown", "tsx", "jsx"],
    } satisfies Options)
    .use(remarkHtml, { sanitize: false } satisfies RemarkHtmlOptions)
    .process(["```" + lang + " " + meta, code, "```"].join("\n"));

  await redis.set(cacheKey, html.value, "EX", 60 * 60 * 12);

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
