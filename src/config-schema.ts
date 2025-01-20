import { z } from 'zod';

const upstreamSchema = z.object({
  id: z.string(),
  url: z.string(),
});

const headerSchema = z.object({
  key: z.string(),
  value: z.string(),
});

const rulesSchema = z.object({
  path: z.string(),
  upstreams: z.array(z.string()), 
});

const serverSchema = z.object({
  listen: z.string(),
  workers: z.number().optional(), 
  upstreams: z.array(upstreamSchema),
  headers: z.array(headerSchema).optional(),
  rules: z.array(rulesSchema),
});

export const configSchema = z.object({
  servers: z.array(serverSchema), 
});

export type typeConfigSchema=z.infer<typeof configSchema>;
