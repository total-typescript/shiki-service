import { RequestHandler } from "express";
import { twoslashQueue } from "../../twoslash-queue.js";
import { environmentSchema, v1SchemaInput } from "../../schema.js";
import { env } from "../../env.js";
import { redis } from "../../redis.js";
import { z } from "zod";

const queue = twoslashQueue({ env: env, redis: redis });

const requiredHeaders = z.object({
  authorization: z.string(),
});

export const v1POST: RequestHandler = async (req, res) => {
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
};
