import { V1Input } from "./schema.js";

export interface QueueItem {
  input: V1Input;
  onDone: (result: string) => void;
  onError: () => void;
}
