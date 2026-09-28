import { z } from 'zod';

const businessType = z.enum(['hotel', 'homestay', 'vehicle', 'tour_operator', 'multi_service']);
const address = z.object({
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(30).optional(),
  country: z.string().trim().length(2).default('PK'),
}).strict();

export const createVendorSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(7).max(30),
  businessType,
  registrationNumber: z.string().trim().min(2).max(100).optional(),
  taxNumber: z.string().trim().max(100).optional(),
  address: address.optional(),
}).strict();

export const updateVendorSchema = createVendorSchema.partial().strict().refine(
  (input) => Object.keys(input).length > 0,
  { message: 'At least one vendor field is required.' },
);

export const attachVendorDocumentSchema = z.object({
  type: z.enum(['identity', 'business_registration', 'tax', 'bank', 'property_authorization']),
  mediaId: z.string().regex(/^med_[0-9a-f-]{36}$/i, 'Invalid media identifier.'),
}).strict();

export const listVendorsQuerySchema = z.object({
  status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'suspended', 'archived']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
}).strict();

export const vendorIdParamsSchema = z.object({
  id: z.string().regex(/^vnd_[0-9a-f-]{36}$/i, 'Invalid vendor identifier.'),
}).strict();

export const vendorDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'suspended']),
  notes: z.string().trim().min(3).max(2_000),
}).strict();
