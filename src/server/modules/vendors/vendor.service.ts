import { randomBytes } from 'node:crypto';
import { connectDatabase } from '../../database/connection.js';
import { MediaModel } from '../../models/media.model.js';
import { UserModel } from '../../models/user.model.js';
import { VendorMemberModel } from '../../models/vendor-member.model.js';
import { VendorModel } from '../../models/vendor.model.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import type { SessionMetadata } from '../auth/auth.service.js';

async function requireDatabase() {
  if (!await connectDatabase()) throw new ServiceUnavailableError('Vendor services are unavailable while the database is disconnected.');
}

function slugify(value: string) {
  const base = value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
  return `${base || 'vendor'}-${randomBytes(3).toString('hex')}`;
}

function serializeVendor(vendor: any) {
  return {
    id: vendor.publicId,
    name: vendor.name,
    slug: vendor.slug,
    email: vendor.email,
    phone: vendor.phone,
    businessType: vendor.businessType,
    registrationNumber: vendor.registrationNumber,
    taxNumber: vendor.taxNumber,
    address: vendor.address,
    status: vendor.status,
    verificationDocuments: vendor.verificationDocuments ?? [],
    verificationNotes: vendor.verificationNotes,
    rejectionReason: vendor.rejectionReason,
    submittedAt: vendor.submittedAt,
    reviewedAt: vendor.reviewedAt,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt,
  };
}

export async function createVendorApplication(userId: string, input: any, metadata: SessionMetadata) {
  await requireDatabase();
  const user = await UserModel.findOne({ _id: userId, status: 'active', deletedAt: null });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User account was not found.');
  if (!user.emailVerifiedAt) throw new AppError(409, 'EMAIL_VERIFICATION_REQUIRED', 'Verify your email before registering as a vendor.');
  if (await VendorMemberModel.exists({ userId, deletedAt: null })) {
    throw new AppError(409, 'VENDOR_MEMBERSHIP_EXISTS', 'This account already belongs to a vendor organization.');
  }

  let vendor: any;
  try {
    vendor = await VendorModel.create({ ownerId: userId, slug: slugify(input.name), ...input });
    await VendorMemberModel.create({ vendorId: vendor._id, userId, role: 'owner', status: 'active' });
    if (!user.roles.includes('vendor_owner')) {
      user.roles.push('vendor_owner');
      await user.save();
    }
  } catch (error) {
    if (vendor?._id) await VendorModel.deleteOne({ _id: vendor._id });
    throw error;
  }

  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'vendor.application_created',
    resourceType: 'vendor', resourceId: vendor.publicId, ...metadata,
  });
  return serializeVendor(vendor);
}

export async function getOwnVendor(userId: string) {
  await requireDatabase();
  const membership = await VendorMemberModel.findOne({ userId, status: 'active', deletedAt: null });
  if (!membership) throw new AppError(404, 'VENDOR_NOT_FOUND', 'No vendor organization is linked to this account.');
  const vendor = await VendorModel.findOne({ _id: membership.vendorId, deletedAt: null });
  if (!vendor) throw new AppError(404, 'VENDOR_NOT_FOUND', 'Vendor organization was not found.');
  return { vendor, membership, public: serializeVendor(vendor) };
}

export async function updateOwnVendor(userId: string, input: any, metadata: SessionMetadata) {
  const { vendor, membership } = await getOwnVendor(userId);
  if (!['owner', 'manager'].includes(membership.role)) throw new AppError(403, 'PERMISSION_DENIED', 'Only vendor owners and managers can update this profile.');
  if (!['draft', 'rejected'].includes(vendor.status)) {
    throw new AppError(409, 'VENDOR_PROFILE_LOCKED', 'Only draft or rejected applications can be edited.');
  }
  Object.assign(vendor, input, vendor.status === 'rejected' ? { status: 'draft', rejectionReason: null } : {});
  await vendor.save();
  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'vendor.profile_updated',
    resourceType: 'vendor', resourceId: vendor.publicId, ...metadata,
  });
  return serializeVendor(vendor);
}

export async function attachVendorDocument(userId: string, input: { type: string; mediaId: string }, metadata: SessionMetadata) {
  const { vendor, membership } = await getOwnVendor(userId);
  if (membership.role !== 'owner') throw new AppError(403, 'PERMISSION_DENIED', 'Only the vendor owner can attach verification documents.');
  if (!['draft', 'rejected'].includes(vendor.status)) throw new AppError(409, 'VENDOR_PROFILE_LOCKED', 'Documents cannot be changed during review.');
  const media = await MediaModel.findOne({ publicId: input.mediaId, ownerId: userId, resourceType: 'document', status: 'ready', deletedAt: null });
  if (!media) throw new AppError(404, 'MEDIA_NOT_FOUND', 'A ready document owned by this user was not found.');
  vendor.verificationDocuments = vendor.verificationDocuments.filter((document: any) => document.type !== input.type);
  vendor.verificationDocuments.push({ type: input.type, mediaId: media._id, status: 'pending' });
  await vendor.save();
  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'vendor.document_attached',
    resourceType: 'vendor', resourceId: vendor.publicId, ...metadata,
    metadata: { documentType: input.type, mediaId: input.mediaId },
  });
  return serializeVendor(vendor);
}

export async function submitOwnVendor(userId: string, metadata: SessionMetadata) {
  const { vendor, membership } = await getOwnVendor(userId);
  if (membership.role !== 'owner') throw new AppError(403, 'PERMISSION_DENIED', 'Only the vendor owner can submit this application.');
  if (!['draft', 'rejected'].includes(vendor.status)) throw new AppError(409, 'INVALID_VENDOR_STATUS', 'This vendor application cannot be submitted.');
  const missing = [
    !vendor.registrationNumber && 'registrationNumber',
    !vendor.address?.line1 && 'address',
    vendor.verificationDocuments.length === 0 && 'verificationDocuments',
  ].filter(Boolean);
  if (missing.length) throw new AppError(400, 'VENDOR_PROFILE_INCOMPLETE', 'Complete the vendor profile before submission.', { missing });
  vendor.status = 'submitted';
  vendor.submittedAt = new Date();
  vendor.rejectionReason = null;
  await vendor.save();
  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'vendor.application_submitted',
    resourceType: 'vendor', resourceId: vendor.publicId, ...metadata,
  });
  return serializeVendor(vendor);
}

export async function listVendorApplications(query: { status?: string; page: number; limit: number }) {
  await requireDatabase();
  const filter = { deletedAt: null, ...(query.status ? { status: query.status } : {}) };
  const [vendors, total] = await Promise.all([
    VendorModel.find(filter).sort({ submittedAt: -1, createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    VendorModel.countDocuments(filter),
  ]);
  return { data: vendors.map(serializeVendor), pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
}

export async function decideVendorApplication(adminUserId: string, vendorId: string, input: { decision: string; notes: string }, metadata: SessionMetadata) {
  await requireDatabase();
  const vendor = await VendorModel.findOne({ publicId: vendorId, deletedAt: null });
  if (!vendor) throw new AppError(404, 'VENDOR_NOT_FOUND', 'Vendor organization was not found.');
  if (input.decision !== 'suspended' && vendor.status !== 'submitted') {
    throw new AppError(409, 'INVALID_VENDOR_STATUS', 'Only submitted applications can be approved or rejected.');
  }
  if (input.decision === 'suspended' && vendor.status !== 'approved') {
    throw new AppError(409, 'INVALID_VENDOR_STATUS', 'Only approved vendors can be suspended.');
  }
  vendor.status = input.decision;
  vendor.reviewedAt = new Date();
  vendor.reviewedBy = adminUserId;
  vendor.verificationNotes = input.notes;
  vendor.rejectionReason = input.decision === 'rejected' ? input.notes : null;
  await vendor.save();
  await recordAuditEvent({
    actorId: adminUserId, actorType: 'user', action: `vendor.${input.decision}`,
    resourceType: 'vendor', resourceId: vendor.publicId, ...metadata,
    metadata: { notes: input.notes },
  });
  return serializeVendor(vendor);
}
