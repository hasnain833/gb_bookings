import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import { MediaModel } from '../../models/media.model.js';
import { UserModel } from '../../models/user.model.js';
import { VendorModel } from '../../models/vendor.model.js';
import { signedDownloadUrl } from '../media/cloudinary.service.js';

/**
 * Automatic pre-check of a partner's CNIC so the admin only has to look closely at what is flagged.
 * It never approves or rejects: a convincing fake passes any check that cannot ask NADRA (Verisys).
 */
export type Finding = { level: 'ok' | 'warn' | 'fail'; text: string };
/** What the AI read from the document; null where it could not read a field. */
export type CnicRead = { isCnic: boolean; readable: boolean; name: string | null; cnicNumber: string | null; expiryDate: string | null };

const digits = (value: string | null | undefined) => (value ?? '').replace(/\D/g, '');
const words = (name: string) => name.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((word) => word.length > 1);

/** Names match when every word of the shorter one appears in the longer ("Ali Khan" ~ "Muhammad Ali Khan"). */
export function namesMatch(a: string, b: string) {
  const [short, long] = [words(a), words(b)].sort((x, y) => x.length - y.length);
  return short.length > 0 && short.every((word) => long.includes(word));
}

/** Turns what was typed, what was read, and the account name into findings. `today` is YYYY-MM-DD. */
export function judgeCnic(input: { typedCnic: string; accountName: string; read: CnicRead | null; today: string }): Finding[] {
  const { typedCnic, accountName, read, today } = input;
  if (!read) return [];
  if (!read.isCnic) return [{ level: 'fail', text: 'The identity document does not look like a Pakistani CNIC.' }];
  if (!read.readable) return [{ level: 'warn', text: 'The CNIC is blurry or partly hidden; compare it by hand.' }];
  const findings: Finding[] = [];
  if (!read.cnicNumber) findings.push({ level: 'warn', text: 'Could not read the CNIC number from the document.' });
  else if (digits(read.cnicNumber) !== digits(typedCnic)) findings.push({ level: 'fail', text: `CNIC number on the document (${read.cnicNumber}) differs from the one typed (${typedCnic}).` });
  else findings.push({ level: 'ok', text: 'CNIC number on the document matches the one typed.' });
  if (!read.name) findings.push({ level: 'warn', text: 'Could not read the name from the document.' });
  else if (namesMatch(read.name, accountName)) findings.push({ level: 'ok', text: `Name on the CNIC (${read.name}) matches the account name.` });
  else findings.push({ level: 'warn', text: `Name on the CNIC (${read.name}) differs from the account name (${accountName}); it may be a relative's or a spelling difference.` });
  if (!read.expiryDate || read.expiryDate === 'lifetime') findings.push({ level: 'ok', text: read.expiryDate ? 'CNIC is valid for life.' : 'No expiry date read; check it by hand.' });
  else if (read.expiryDate < today) findings.push({ level: 'fail', text: `CNIC expired on ${read.expiryDate}.` });
  else findings.push({ level: 'ok', text: `CNIC valid until ${read.expiryDate}.` });
  return findings;
}

let ai: GoogleGenAI | null = null;

/** Asks Gemini to read the CNIC (PDF or image). Returns null when AI reading is not configured. */
async function readCnic(file: { mimeType: string; data: Buffer }): Promise<CnicRead | null> {
  if (!env.GEMINI_API_KEY) return null;
  ai ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const result = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: [{ role: 'user', parts: [
      { inlineData: { mimeType: file.mimeType, data: file.data.toString('base64') } },
      { text: 'This should be a Pakistani CNIC (computerised national identity card), front and possibly back. Read it. Give the holder\'s name in English as printed, the identity number as 12345-1234567-1, and the date of expiry as YYYY-MM-DD ("lifetime" if it says so). Use null for anything you cannot read. Do not guess.' },
    ] }],
    config: {
      temperature: 0,
      abortSignal: AbortSignal.timeout(25_000),
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          isCnic: { type: 'boolean' }, readable: { type: 'boolean' },
          name: { type: ['string', 'null'] }, cnicNumber: { type: ['string', 'null'] }, expiryDate: { type: ['string', 'null'] },
        },
        required: ['isCnic', 'readable', 'name', 'cnicNumber', 'expiryDate'],
      },
    },
  });
  return JSON.parse(result.text ?? 'null');
}

/** Runs the pre-check for a vendor document and saves the result on it. Never throws: failures become findings. */
export async function runIdentityCheck(vendor: any) {
  const findings: Finding[] = [];
  let read: CnicRead | null = null;
  const cnic = vendor.cnicNumber as string | undefined;
  if (!cnic) {
    findings.push({ level: 'warn', text: 'No CNIC number was typed on the application.' });
  } else {
    const others = await VendorModel.find({ _id: { $ne: vendor._id }, cnicNumber: cnic, deletedAt: null }).select('name status').limit(3).lean() as any[];
    // One account is one partner type, so the same person may honestly run a hotel and a car business.
    if (others.length) findings.push({ level: 'warn', text: `Same CNIC is on ${others.map((other) => `${other.name} (${other.status})`).join(', ')}.` });
    else findings.push({ level: 'ok', text: 'CNIC is not used by any other partner account.' });

    const document = vendor.verificationDocuments?.find((item: any) => item.type === 'identity');
    const media: any = document && await MediaModel.findById(document.mediaId).lean();
    if (!env.GEMINI_API_KEY) findings.push({ level: 'warn', text: 'Automatic document reading is off (no GEMINI_API_KEY); open the CNIC and compare it by hand.' });
    else if (!media) findings.push({ level: 'warn', text: 'No CNIC document attached.' });
    else {
      try {
        const response = await fetch(signedDownloadUrl(media.providerAssetId, media.providerResourceType, media.deliveryType, 60), { signal: AbortSignal.timeout(15_000) });
        if (!response.ok) throw new Error(`storage returned ${response.status}`);
        read = await readCnic({ mimeType: media.mimeType, data: Buffer.from(await response.arrayBuffer()) });
        const owner: any = await UserModel.findById(vendor.ownerId).select('name').lean();
        findings.push(...judgeCnic({ typedCnic: cnic, accountName: owner?.name ?? vendor.name, read, today: new Date().toISOString().slice(0, 10) }));
      } catch (error) {
        console.error(`CNIC check for ${vendor.publicId} failed:`, error);
        findings.push({ level: 'warn', text: 'Could not read the CNIC automatically; compare it by hand.' });
      }
    }
  }
  const identityCheck = {
    status: findings.some((finding) => finding.level !== 'ok') ? 'flagged' : 'passed',
    findings,
    read: read ? { name: read.name ?? undefined, cnicNumber: read.cnicNumber ?? undefined, expiryDate: read.expiryDate ?? undefined } : undefined,
    checkedAt: new Date(),
  };
  await VendorModel.updateOne({ _id: vendor._id }, { $set: { identityCheck } });
  return identityCheck;
}
