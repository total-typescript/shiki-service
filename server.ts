import bodyParser from "body-parser";
import express from "express";
import { Redis } from "ioredis";
import { z } from "zod";
import { environmentSchema, v1SchemaInput } from "./schema.js";
import { twoslashQueue } from "./twoslash-queue.js";

const env = environmentSchema.parse(process.env);

let redis: Redis = {} as any;

if (env.USE_REDIS) {
  redis = new Redis({
    family: 6,
    port: 6379,
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

app.get("/", (req, res) => {
  res.send("Healthy!");
});

const queue = twoslashQueue({ env, redis });

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

  const html = await queue.enqueue(input.data);

  return res.send(html);
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
