import { connectDatabase } from '../../database/connection.js';
import { MediaModel } from '../../models/media.model.js';
import { AppError, ServiceUnavailableError } from '../../shared/app-error.js';
import { recordAuditEvent } from '../audit/audit.service.js';
import type { SessionMetadata } from '../auth/auth.service.js';
import { destroyCloudinaryAsset, isCloudinaryConfigured, uploadMediaBuffer } from './cloudinary.service.js';

async function requireDependencies() {
  if (!await connectDatabase()) throw new ServiceUnavailableError('Media services are unavailable while the database is disconnected.');
  if (!isCloudinaryConfigured()) throw new AppError(503, 'MEDIA_PROVIDER_NOT_CONFIGURED', 'Cloudinary media storage is not configured.');
}

function serializeMedia(media: any) {
  return {
    id: media.publicId,
    resourceType: media.resourceType,
    mimeType: media.mimeType,
    bytes: media.bytes,
    width: media.width,
    height: media.height,
    status: media.status,
    ...(media.resourceType === 'document' ? {} : { url: media.url }),
    createdAt: media.createdAt,
  };
}

export async function uploadOwnedMedia(
  userId: string,
  file: Express.Multer.File,
  kind: 'image' | 'document',
  metadata: SessionMetadata,
) {
  await requireDependencies();
  const resourceType = kind === 'image' ? 'image' : 'raw';
  const deliveryType = kind === 'image' ? 'upload' : 'authenticated';
  const result = await uploadMediaBuffer(file.buffer, {
    folder: `gbbookings/${kind === 'image' ? 'images' : 'documents'}/${userId}`,
    resourceType,
    deliveryType,
  });

  try {
    const media = await MediaModel.create({
      ownerId: userId,
      provider: 'cloudinary',
      providerAssetId: result.public_id,
      providerResourceType: resourceType,
      deliveryType,
      url: result.secure_url,
      resourceType: kind,
      mimeType: file.mimetype,
      bytes: result.bytes ?? file.size,
      width: result.width,
      height: result.height,
      status: 'ready',
    });
    await recordAuditEvent({
      actorId: userId, actorType: 'user', action: 'media.uploaded',
      resourceType: 'media', resourceId: media.publicId, ...metadata,
      metadata: { kind, mimeType: file.mimetype, bytes: media.bytes },
    });
    return serializeMedia(media);
  } catch (error) {
    await destroyCloudinaryAsset(result.public_id, resourceType, deliveryType);
    throw error;
  }
}

export async function listOwnedMedia(userId: string, kind?: 'image' | 'document') {
  await requireDependencies();
  const records = await MediaModel.find({ ownerId: userId, deletedAt: null, ...(kind ? { resourceType: kind } : {}) })
    .sort({ createdAt: -1 }).lean();
  return records.map(serializeMedia);
}

export async function deleteOwnedMedia(userId: string, mediaId: string, metadata: SessionMetadata) {
  await requireDependencies();
  const media = await MediaModel.findOne({ publicId: mediaId, ownerId: userId, deletedAt: null });
  if (!media) throw new AppError(404, 'MEDIA_NOT_FOUND', 'Media file was not found.');
  await destroyCloudinaryAsset(media.providerAssetId, media.providerResourceType, media.deliveryType);
  media.deletedAt = new Date();
  await media.save();
  await recordAuditEvent({
    actorId: userId, actorType: 'user', action: 'media.deleted',
    resourceType: 'media', resourceId: media.publicId, ...metadata,
  });
}
