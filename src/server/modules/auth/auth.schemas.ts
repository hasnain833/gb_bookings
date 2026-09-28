import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string()
  .min(8)
  .max(72)
  .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.');

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email,
  phone: z.string().trim().min(7).max(30).optional(),
  password,
}).strict();

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
  rememberMe: z.boolean().default(false),
}).strict();

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.union([z.string().trim().min(7).max(30), z.literal('')]).optional(),
}).strict().refine((input) => Object.keys(input).length > 0, {
  message: 'At least one profile field is required.',
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: password,
}).strict().refine((input) => input.currentPassword !== input.newPassword, {
  message: 'New password must be different from the current password.',
  path: ['newPassword'],
});

export const forgotPasswordSchema = z.object({ email }).strict();

export const tokenSchema = z.object({
  token: z.string().min(32).max(256),
}).strict();

export const resetPasswordSchema = tokenSchema.extend({
  newPassword: password,
});

const otpCode = z.string().regex(/^\d{6}$/, 'Enter the 6-digit security code.');
const challengeId = z.string().regex(/^otp_[0-9a-f-]{36}$/i, 'Invalid challenge identifier.');

export const verifyOtpSchema = z.object({ challengeId, code: otpCode }).strict();

export const twoFactorSetupSchema = z.object({
  channel: z.enum(['email', 'sms']).default('email'),
}).strict();

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1).max(72),
}).strict();

export const sessionIdParamsSchema = z.object({
  id: z.string().regex(/^ses_[0-9a-f-]{36}$/i, 'Invalid session identifier.'),
}).strict();
