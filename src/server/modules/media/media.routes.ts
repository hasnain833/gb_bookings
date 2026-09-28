import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { env } from '../../config/env.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { AppError } from '../../shared/app-error.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { sessionMetadata } from '../auth/auth.service.js';
import { deleteOwnedMedia, listOwnedMedia, uploadOwnedMedia } from './media.service.js';
import { listMediaQuerySchema, mediaIdParamsSchema, mediaKindParamsSchema } from './media.schemas.js';

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: env.MEDIA_MAX_FILE_MB * 1024 * 1024 },
  fileFilter(request, file, callback) {
    const isDocument = request.params.kind === 'documents';
    const allowed = isDocument ? file.mimetype === 'application/pdf' : imageTypes.has(file.mimetype);
    if (allowed) return callback(null, true);
    callback(new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', isDocument
      ? 'Vendor documents must be PDF files.'
      : 'Images must be JPEG, PNG, WebP, or AVIF.'));
  },
});

const parseUpload: RequestHandler = (request, response, next) => {
  upload.single('file')(request, response, (error) => {
    if (error instanceof multer.MulterError) {
      return next(new AppError(
        error.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
        error.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_UPLOAD',
        error.code === 'LIMIT_FILE_SIZE'
          ? `Files must be no larger than ${env.MEDIA_MAX_FILE_MB} MB.`
          : 'The upload request is invalid.',
      ));
    }
    if (error) return next(error);
    if (!request.file) return next(new AppError(400, 'FILE_REQUIRED', 'Attach one file using the file field.'));
    next();
  });
};

export const mediaRouter = Router();
mediaRouter.use(authenticate);

mediaRouter.post('/:kind', validate('params', mediaKindParamsSchema), parseUpload, asyncHandler(async (request, response) => {
  const kind = request.params.kind === 'images' ? 'image' : 'document';
  const media = await uploadOwnedMedia(request.auth!.userId, request.file!, kind, sessionMetadata(request));
  response.status(201).json({ data: media });
}));

mediaRouter.get('/', validate('query', listMediaQuerySchema), asyncHandler(async (request, response) => {
  const records = await listOwnedMedia(request.auth!.userId, request.query.kind as 'image' | 'document' | undefined);
  response.json({ data: records });
}));

mediaRouter.delete('/:id', validate('params', mediaIdParamsSchema), asyncHandler(async (request, response) => {
  await deleteOwnedMedia(request.auth!.userId, request.params.id, sessionMetadata(request));
  response.status(204).send();
}));
