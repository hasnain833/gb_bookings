import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { connectDatabase } from '../../database/connection.js';
import { inTransaction } from '../../database/transaction.js';
import { MediaModel } from '../../models/media.model.js';
import { UserModel } from '../../models/user.model.js';
import { VendorMemberModel } from '../../models/vendor-member.model.js';
import { VendorModel } from '../../models/vendor.model.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import type { SessionMetadata } from '../auth/auth.service.js';
import { requestPasswordReset } from '../auth/account-recovery.service.js';
import { isEmailConfigured } from '../email/resend.service.js';
import { isCloudinaryConfigured, signedDownloadUrl } from '../media/cloudinary.service.js';
import { notifyVendorDecision } from './vendor-notifications.js';
import { canAccess } from './member-access.js';

// Hotels prove a registered business; homestay hosts are usually families, verified by CNIC and proof of the property.
const REQUIRED_DOCUMENTS: Record<string, string[]> = {
  hotel: ['business_registration', 'identity'],
  homestay: ['identity', 'property_authorization'],
  // Car partners: rental companies add a business registration number; owner-drivers add their driving licence instead.
  vehicle: ['identity', 'vehicle_registration'],
};

/** Business types verified without a registration number (owner-drivers are individuals). */
const NO_REGISTRATION = ['homestay', 'vehicle'];

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
    pendingChanges: vendor.pendingChanges ?? undefined,
    changeRejectionReason: vendor.changeRejectionReason,
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
  const vendor = await inTransaction(async (session) => {
    // Lock the user before checking membership; simultaneous applications cannot create two organizations.
    // The vendor_owner role is only granted when an admin approves the application.
    await UserModel.updateOne({ _id: userId }, { $inc: { __v: 1 } }, { session });
    if (await VendorMemberModel.exists({ userId, deletedAt: null }).session(session)) {
      throw new AppError(409, 'VENDOR_MEMBERSHIP_EXISTS', 'This account already belongs to a vendor organization.');
    }
    const [vendor] = await VendorModel.create([{ ownerId: userId, slug: slugify(input.name), ...input }], { session });
    await VendorMemberModel.create([{ vendorId: vendor._id, userId, role: 'owner', status: 'active' }], { session });
    return vendor;
  });

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
  const attached = new Set(vendor.verificationDocuments.map((document: any) => document.type));
  const missing = [
    !vendor.registrationNumber && !NO_REGISTRATION.includes(vendor.businessType) && 'registrationNumber',
    vendor.businessType === 'vehicle' && !vendor.registrationNumber && !attached.has('driving_licence') && 'driving_licence',
    !vendor.address?.line1 && 'address',
    vendor.verificationDocuments.length === 0 && 'verificationDocuments',
    ...(REQUIRED_DOCUMENTS[vendor.businessType] ?? []).filter((type) => !attached.has(type)),
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

/** An approved vendor asks to change its business details; nothing changes until an admin approves. */
export async function requestVendorChanges(userId: string, input: any, metadata: SessionMetadata) {
  const { vendor, membership } = await getOwnVendor(userId);
  if (!canAccess(membership.role, 'business')) throw new AppError(403, 'PERMISSION_DENIED', 'Only the business owner can request changes.');
  if (vendor.status !== 'approved') throw new AppError(409, 'INVALID_VENDOR_STATUS', 'Only approved businesses can request changes.');
  if (!input.registrationNumber && !NO_REGISTRATION.includes(vendor.businessType)) throw new AppError(400, 'VALIDATION_ERROR', 'Hotel businesses must keep a registration number.');
  vendor.pendingChanges = { ...input, requestedAt: new Date() };
  vendor.changeRejectionReason = null;
  await vendor.save();
  await recordAuditEvent({ actorId: userId, actorType: 'user', action: 'vendor.changes_requested', resourceType: 'vendor', resourceId: vendor.publicId, ...metadata, metadata: input });
  return serializeVendor(vendor);
}

export async function decideVendorChanges(adminUserId: string, vendorId: string, input: { decision: 'approved' | 'rejected'; notes: string }, metadata: SessionMetadata) {
  await requireDatabase();
  const vendor = await VendorModel.findOne({ publicId: vendorId, deletedAt: null });
  if (!vendor?.pendingChanges?.requestedAt) throw new AppError(404, 'CHANGE_REQUEST_NOT_FOUND', 'This business has no pending change request.');
  const changes = vendor.pendingChanges.toObject ? vendor.pendingChanges.toObject() : vendor.pendingChanges;
  if (input.decision === 'approved') {
    const { requestedAt, address, ...fields } = changes;
    Object.assign(vendor, fields);
    vendor.address = { ...(vendor.address?.toObject?.() ?? vendor.address ?? {}), ...address };
    vendor.changeRejectionReason = null;
  } else {
    vendor.changeRejectionReason = input.notes;
  }
  vendor.pendingChanges = undefined;
  await vendor.save();
  await recordAuditEvent({
    actorId: adminUserId, actorType: 'user', action: `vendor.changes_${input.decision}`, resourceType: 'vendor', resourceId: vendor.publicId, ...metadata,
    metadata: { notes: input.notes, changes },
  });
  await notifyVendorDecision(vendor, `vendor.changes_${input.decision}`, { reason: input.decision === 'rejected' ? input.notes : undefined });
  return serializeVendor(vendor);
}

export async function listVendorApplications(query: { status?: string; changes?: 'pending'; page: number; limit: number }) {
  await requireDatabase();
  const filter = { deletedAt: null, ...(query.status ? { status: query.status } : {}), ...(query.changes ? { 'pendingChanges.requestedAt': { $exists: true } } : {}) };
  const [vendors, total] = await Promise.all([
    VendorModel.find(filter).sort({ submittedAt: -1, createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    VendorModel.countDocuments(filter),
  ]);
  // Admins review documents through short-lived signed links; the stored assets stay private.
  const mediaIds = vendors.flatMap((vendor: any) => (vendor.verificationDocuments ?? []).map((document: any) => document.mediaId));
  const media = new Map((await MediaModel.find({ _id: { $in: mediaIds }, deletedAt: null }).lean() as any[])
    .map((record) => [String(record._id), record]));
  const withDocumentLinks = (vendor: any) => ({
    ...serializeVendor(vendor),
    verificationDocuments: (vendor.verificationDocuments ?? []).map((document: any) => {
      const record = media.get(String(document.mediaId));
      return {
        type: document.type,
        status: document.status,
        mimeType: record?.mimeType,
        url: record && isCloudinaryConfigured()
          ? signedDownloadUrl(record.providerAssetId, record.providerResourceType, record.deliveryType)
          : undefined,
      };
    }),
  });
  return { data: vendors.map(withDocumentLinks), pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
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
  // Approval grants the owner the vendor role (partner dashboard, listings); suspension takes it away again.
  await inTransaction(async (session) => {
    await vendor.save({ session });
    if (input.decision === 'approved') await UserModel.updateOne({ _id: vendor.ownerId }, { $addToSet: { roles: 'vendor_owner' } }, { session });
    if (input.decision === 'suspended') await UserModel.updateOne({ _id: vendor.ownerId }, { $pull: { roles: 'vendor_owner' } }, { session });
  });
  await recordAuditEvent({
    actorId: adminUserId, actorType: 'user', action: `vendor.${input.decision}`,
    resourceType: 'vendor', resourceId: vendor.publicId, ...metadata,
    metadata: { notes: input.notes },
  });
  const decision = input.decision as 'approved' | 'rejected' | 'suspended';
  await notifyVendorDecision(vendor, `vendor.${decision}`, { reason: decision === 'approved' ? undefined : input.notes });
  return serializeVendor(vendor);
}

/** Owner-only access to an approved business's team. */
async function ownedApprovedVendor(userId: string) {
  const { vendor, membership } = await getOwnVendor(userId);
  if (!canAccess(membership.role, 'team')) throw new AppError(403, 'PERMISSION_DENIED', 'Only the business owner can manage the team.');
  if (vendor.status !== 'approved') throw new AppError(409, 'INVALID_VENDOR_STATUS', 'Your business must be approved before adding staff.');
  return vendor;
}

function serializeMember(member: any, user: any) {
  return { id: member.publicId, role: member.role, status: member.status, name: user?.name, email: user?.email, createdAt: member.createdAt };
}

export async function listTeam(userId: string) {
  const { vendor, membership } = await getOwnVendor(userId);
  if (!canAccess(membership.role, 'team')) throw new AppError(403, 'PERMISSION_DENIED', 'Only the business owner can view the team.');
  const members = await VendorMemberModel.find({ vendorId: vendor._id, deletedAt: null }).sort({ createdAt: 1 }).lean() as any[];
  const users = new Map((await UserModel.find({ _id: { $in: members.map((member) => member.userId) } }).select('name email').lean() as any[])
    .map((user) => [String(user._id), user]));
  return members.map((member) => serializeMember(member, users.get(String(member.userId))));
}

/**
 * Adds hotel staff. An existing account is linked; a new one is created without a usable password and sent a
 * one-time password setup link, the same way platform admins are invited.
 */
export async function addTeamMember(userId: string, input: { name: string; email: string; role: 'manager' | 'reservations' }, metadata: SessionMetadata) {
  const vendor = await ownedApprovedVendor(userId);
  if (!isEmailConfigured()) throw new ServiceUnavailableError('Email must be configured before inviting staff.');
  let created = false;
  const result = await inTransaction(async (session) => {
    let user = await UserModel.findOne({ email: input.email, deletedAt: null }).session(session);
    if (user) {
      if (user.status !== 'active') throw new AppError(409, 'USER_NOT_ACTIVE', 'This account is not active.');
      if (user.roles.includes('admin')) throw new AppError(409, 'USER_IS_ADMIN', 'Platform administrators cannot join a hotel team.');
      // Lock the user so two simultaneous invites cannot add them to two businesses.
      await UserModel.updateOne({ _id: user._id }, { $inc: { __v: 1 } }, { session });
      if (await VendorMemberModel.exists({ userId: user._id, deletedAt: null }).session(session)) {
        throw new AppError(409, 'VENDOR_MEMBERSHIP_EXISTS', 'This person already belongs to a hotel business on GBBookings.');
      }
      await UserModel.updateOne({ _id: user._id }, { $addToSet: { roles: 'vendor_staff' } }, { session });
    } else {
      [user] = await UserModel.create([{
        name: input.name, email: input.email, roles: ['customer', 'vendor_staff'],
        passwordHash: await bcrypt.hash(randomBytes(48).toString('base64url'), 12),
      }], { session });
      created = true;
    }
    // Upsert: someone removed earlier keeps their (vendor, user) record, which the unique index would otherwise reject.
    const member = await VendorMemberModel.findOneAndUpdate(
      { vendorId: vendor._id, userId: user._id },
      { $set: { role: input.role, status: 'active', invitedBy: userId, deletedAt: null } },
      { upsert: true, setDefaultsOnInsert: true, returnDocument: 'after', session },
    );
    return { member, user };
  });
  const passwordSetupSent = created ? await requestPasswordReset(result.user.email, metadata) : undefined;
  await notifyVendorDecision({ name: result.user.name, email: result.user.email }, 'team.added', { hotel: vendor.name });
  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'vendor.member_added', resourceType: 'vendor', resourceId: vendor.publicId, ...metadata,
    metadata: { memberId: result.member.publicId, role: input.role, newAccount: created },
  });
  return { data: serializeMember(result.member, result.user), newAccount: created, passwordSetupSent };
}

/** Removes a staff member's access at once; bookings and listings re-check membership on every request. */
export async function removeTeamMember(userId: string, memberId: string, metadata: SessionMetadata) {
  const vendor = await ownedApprovedVendor(userId);
  const member = await VendorMemberModel.findOne({ publicId: memberId, vendorId: vendor._id, deletedAt: null });
  if (!member) throw new AppError(404, 'MEMBER_NOT_FOUND', 'Team member not found.');
  if (member.role === 'owner') throw new AppError(409, 'CANNOT_REMOVE_OWNER', 'The business owner cannot be removed.');
  await inTransaction(async (session) => {
    await VendorMemberModel.updateOne({ _id: member._id }, { $set: { deletedAt: new Date(), status: 'suspended' } }, { session });
    await UserModel.updateOne({ _id: member.userId }, { $pull: { roles: 'vendor_staff' } }, { session });
  });
  await recordAuditEvent({ actorId: userId, actorType: 'user', action: 'vendor.member_removed', resourceType: 'vendor', resourceId: vendor.publicId, ...metadata, metadata: { memberId } });
}
