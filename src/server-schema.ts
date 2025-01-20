import { z } from 'zod';
export const workerMessageSchema = z.object({
  requestType: z.string(),
  headers: z.any(),
  body: z.any(),
  path: z.string(),
});
export type WorkerMessageType = z.infer<typeof workerMessageSchema>;