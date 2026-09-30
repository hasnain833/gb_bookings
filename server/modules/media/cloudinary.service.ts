import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/app-error.js';

export function isCloudinaryConfigured() {
  return Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
}

function configure() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError(503, 'MEDIA_PROVIDER_NOT_CONFIGURED', 'Cloudinary media storage is not configured.');
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadMediaBuffer(
  buffer: Buffer,
  options: { folder: string; resourceType: 'image' | 'raw'; deliveryType: 'upload' | 'authenticated' },
) {
  configure();
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: options.folder,
      resource_type: options.resourceType,
      type: options.deliveryType,
      use_filename: false,
      unique_filename: true,
      overwrite: false,
    }, (error, result) => {
      if (error || !result) return reject(new AppError(502, 'MEDIA_UPLOAD_FAILED', 'Cloudinary could not store this file.'));
      resolve(result);
    });
    stream.end(buffer);
  });
}

export async function destroyCloudinaryAsset(publicId: string, resourceType: 'image' | 'raw' | 'video', deliveryType: 'upload' | 'authenticated') {
  configure();
  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    type: deliveryType,
    invalidate: deliveryType === 'upload',
  });
  if (!['ok', 'not found'].includes(result.result)) {
    throw new AppError(502, 'MEDIA_DELETE_FAILED', 'Cloudinary could not delete this file.');
  }
}

/** Short-lived download link for an authenticated (private) asset such as a vendor verification document. */
export function signedDownloadUrl(publicId: string, resourceType: 'image' | 'raw' | 'video', deliveryType: 'upload' | 'authenticated', ttlSeconds = 600) {
  configure();
  return cloudinary.utils.private_download_url(publicId, '', {
    resource_type: resourceType,
    type: deliveryType,
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
  });
}
