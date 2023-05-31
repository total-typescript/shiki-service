import bodyParser from "body-parser";
import express from "express";
import { remark } from "remark";
import remarkHtml, { Options as RemarkHtmlOptions } from "remark-html";
import remarkTwoslash, { Options } from "remark-shiki-twoslash";
import { z } from "zod";

const app = express();
const port = 3000;

app.use(bodyParser.json());

const requiredHeaders = z.object({
  authorization: z.string(),
});

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

  if (headers.data.authorization !== process.env.AUTHORIZATION) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const input = v1SchemaInput.safeParse(body);

  if (!input.success) {
    return res.status(400).json({ error: input.error });
  }

  const { code, lang, meta, theme } = input.data;

  const html = await remark()
    .use(remarkTwoslash.default, {
      theme: theme,
      langs: ["typescript", "javascript", "json", "markdown", "tsx", "jsx"],
    } satisfies Options)
    .use(remarkHtml, { sanitize: false } satisfies RemarkHtmlOptions)
    .process(["```" + lang + " " + meta, code, "```"].join("\n"));

  return res.send(html.value);
});

app.listen(port, () => console.log(`HelloNode app listening on port ${port}!`));