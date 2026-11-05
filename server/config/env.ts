import "dotenv/config";
import { z } from "zod";

const booleanFromString = z.preprocess(
  (value) => value === true || value === "true",
  z.boolean(),
);

const optionalString = (schema: z.ZodString) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    schema.optional(),
  );

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  APP_URL: optionalString(z.string().url()),
  MONGODB_URI: optionalString(z.string().min(1)),
  MONGODB_DB_NAME: z.string().min(1).default("gbbookings"),
  TRUST_PROXY: booleanFromString.default(false),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32)
    .default("development-only-access-secret-change-me"),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  // Legacy setting accepted; remembered login/device trust is fixed at seven days.
  REMEMBER_ME_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(7),
  EMAIL_VERIFICATION_TTL_MINUTES: z.coerce
    .number()
    .int()
    .min(5)
    .max(1440)
    .default(60),
  PASSWORD_RESET_TTL_MINUTES: z.coerce
    .number()
    .int()
    .min(5)
    .max(120)
    .default(30),
  OTP_TTL_MINUTES: z.coerce.number().int().min(2).max(30).default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(10).default(5),
  // "Sign in with Google" (Google Cloud → Credentials → OAuth client ID, type Web). Same value as VITE_GOOGLE_CLIENT_ID.
  GOOGLE_CLIENT_ID: optionalString(z.string().min(1)),
  RESEND_API_KEY: optionalString(z.string().min(1)),
  RESEND_SENDER_EMAIL: optionalString(z.string().email()),
  RESEND_SENDER_NAME: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[^\r\n]+$/)
    .default("GBBookings"),
  CLOUDINARY_CLOUD_NAME: optionalString(z.string().min(1)),
  CLOUDINARY_API_KEY: optionalString(z.string().min(1)),
  CLOUDINARY_API_SECRET: optionalString(z.string().min(1)),
  // Vercel refuses requests over about 4.5 MB, so the default stays under that.
  MEDIA_MAX_FILE_MB: z.coerce.number().int().min(1).max(25).default(4),
  GEMINI_API_KEY: optionalString(z.string().min(1)),
  // Sending CNIC PDFs to Gemini is off by default: free plans may use data to improve Google's products. Turn on only with a paid plan.
  CNIC_AI_CHECK: booleanFromString.default(false),
  // Used by the trip assistant and the CNIC pre-check; change it here if Google retires the model.
  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  // Hours a property has to accept or decline a booking request before it expires and the rooms are released.
  PENDING_BOOKING_HOURS: z.coerce.number().int().min(1).max(168).default(24),
  // Safepay hosted checkout ("Pay now"). Without both keys only Pay on arrival is offered.
  SAFEPAY_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  SAFEPAY_API_KEY: optionalString(z.string().min(1)),
  SAFEPAY_SECRET_KEY: optionalString(z.string().min(1)),
  // false until a partial refund has been tried with a paid sandbox booking; refunds then wait in the admin queue to be sent by hand.
  SAFEPAY_AUTO_REFUNDS: booleanFromString.default(false),
  // Inngest runs the scheduled jobs and carries realtime messages. Without keys: a timer on a long-running server, polling in the inbox.
  INNGEST_DEV: optionalString(z.string().min(1)),
  INNGEST_EVENT_KEY: optionalString(z.string().min(1)),
  INNGEST_SIGNING_KEY: optionalString(z.string().min(1)),
  VERCEL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

if (parsed.data.NODE_ENV === "production" && !parsed.data.MONGODB_URI) {
  throw new Error("MONGODB_URI is required when NODE_ENV=production.");
}

if (parsed.data.NODE_ENV === "production" && !parsed.data.APP_URL) {
  throw new Error(
    "APP_URL is required when NODE_ENV=production: reset and payment links use it.",
  );
}

if (parsed.data.NODE_ENV === "production" && parsed.data.INNGEST_DEV) {
  throw new Error(
    "INNGEST_DEV must not be set when NODE_ENV=production: it can turn off Inngest's signature check.",
  );
}

if (
  parsed.data.NODE_ENV === "production" &&
  /^(development-only|replace-with)/.test(parsed.data.JWT_ACCESS_SECRET)
) {
  throw new Error(
    "JWT_ACCESS_SECRET must be configured when NODE_ENV=production.",
  );
}

const cloudinaryValues = [
  parsed.data.CLOUDINARY_CLOUD_NAME,
  parsed.data.CLOUDINARY_API_KEY,
  parsed.data.CLOUDINARY_API_SECRET,
];
if (cloudinaryValues.some(Boolean) && !cloudinaryValues.every(Boolean)) {
  throw new Error(
    "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be configured together.",
  );
}

export const env = parsed.data;

export type AppEnv = typeof env;
