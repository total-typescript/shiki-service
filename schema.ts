import { z } from "zod";

export const v1SchemaInput = z.object({
  code: z.string(),
  lang: z.string(),
  meta: z.string().optional().nullable().default(""),
  theme: z.string().optional().default("github-dark"),
});

export type V1Input = z.infer<typeof v1SchemaInput>;

export const environmentSchema = z.object({
  AUTHORIZATION: z.string(),
  REDIS_PASSWORD: z.string(),
  REDIS_HOST: z.string(),
  USE_REDIS: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export type Environment = z.infer<typeof environmentSchema>;
