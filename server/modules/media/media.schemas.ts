import { z } from 'zod';

export const mediaKindParamsSchema = z.object({ kind: z.enum(['images', 'documents']) }).strict();
export const mediaIdParamsSchema = z.object({ id: z.string().regex(/^med_[0-9a-f-]{36}$/i, 'Invalid media identifier.') }).strict();
export const listMediaQuerySchema = z.object({ kind: z.enum(['image', 'document']).optional() }).strict();
