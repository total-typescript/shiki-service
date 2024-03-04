import { environmentSchema } from "./schema.js";

export const env = environmentSchema.parse(process.env);
