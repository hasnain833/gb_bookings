import { z } from 'zod';

// 13 digits, dashes optional; stored as 12345-1234567-1.
const phoneNumber = z.string().trim().regex(/^\+?\d[\d ()-]{6,19}$/, 'Enter a phone number, like 0300 1234567.');
const cnicNumber = z.string().trim().regex(/^\d{5}-?\d{7}-?\d$/, 'Enter the CNIC as 12345-1234567-1.')
  .transform((value) => value.replace(/-/g, '').replace(/^(\d{5})(\d{7})(\d)$/, '$1-$2-$3'));
const businessType = z.enum(['hotel', 'homestay', 'vehicle', 'tour_operator', 'multi_service']);
const address = z.object({
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(30).optional(),
  country: z.string().trim().length(2).default('PK'),
}).strict();

/** A Pakistani IBAN with valid ISO 7064 check digits, so a mistyped account cannot be saved. */
export function isValidIban(value: string) {
  if (!/^PK\d{2}[A-Z]{4}\d{16}$/.test(value)) return false;
  const digits = `${value.slice(4)}${value.slice(0, 4)}`.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));
  return digits.split('').reduce((remainder, digit) => (remainder * 10 + Number(digit)) % 97, 0) === 1;
}

export const payoutProfileSchema = z.object({
  accountTitle: z.string().trim().min(2).max(160),
  bankName: z.string().trim().min(2).max(120),
  iban: z.string().trim().toUpperCase().transform((value) => value.replace(/\s/g, '')).refine(isValidIban, 'Enter a valid Pakistani IBAN, e.g. PK36SCBL0000001123456702.'),
}).strict();

export const createVendorSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: phoneNumber,
  businessType,
  registrationNumber: z.string().trim().min(2).max(100).optional(),
  taxNumber: z.string().trim().max(100).optional(),
  cnicNumber: cnicNumber.optional(),
  address: address.optional(),
  payoutProfile: payoutProfileSchema.optional(),
}).strict();

export const updateVendorSchema = createVendorSchema.partial().strict().refine(
  (input) => Object.keys(input).length > 0,
  { message: 'At least one vendor field is required.' },
);

export const attachVendorDocumentSchema = z.object({
  type: z.enum(['identity', 'business_registration', 'tax', 'bank', 'property_authorization', 'vehicle_registration', 'driving_licence', 'guide_licence']),
  mediaId: z.string().regex(/^med_[0-9a-f-]{36}$/i, 'Invalid media identifier.'),
}).strict();

export const vendorChangeRequestSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: phoneNumber,
  // Required for hotel businesses; homestay hosts, car owner-drivers and independent guides are verified by documents instead.
  registrationNumber: z.string().trim().min(2).max(100).optional(),
  taxNumber: z.string().trim().max(100).optional(),
  address: z.object({ line1: z.string().trim().min(2).max(200), city: z.string().trim().min(2).max(100), region: z.string().trim().min(2).max(100) }).strict(),
  payoutProfile: payoutProfileSchema.optional(),
}).strict();

export const acceptAgreementSchema = z.object({ version: z.string().min(1).max(20) }).strict();

export const vendorChangeDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().trim().min(3).max(2_000),
}).strict();

export const listVendorsQuerySchema = z.object({
  changes: z.literal('pending').optional(),
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

// Roles an owner can hand out: managers run hotels and reservations, reception only works reservations.
export const addTeamMemberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(['manager', 'reservations']),
}).strict();

export const teamMemberParamsSchema = z.object({
  id: z.string().regex(/^vmb_[0-9a-f-]{36}$/i, 'Invalid team member identifier.'),
}).strict();
