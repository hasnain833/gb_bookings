import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { connectDatabase, disconnectDatabase } from '../src/server/database/connection.js';
import { logger } from '../src/server/config/logger.js';
import { ListingModel } from '../src/server/models/listing.model.js';
import { listingSeedSchema } from '../src/server/modules/listings/listing.schemas.js';

async function seed() {
  const fileArgument = process.argv[2];
  if (!fileArgument) {
    throw new Error('Provide a JSON seed file: npm run seed:listings -- path/to/listings.json');
  }

  if (!await connectDatabase()) {
    throw new Error('A working MONGODB_URI is required to seed listings.');
  }

  const filePath = path.resolve(process.cwd(), fileArgument);
  const raw = await readFile(filePath, 'utf8');
  const listings = listingSeedSchema.parse(JSON.parse(raw));

  if (listings.length === 0) {
    logger.info('Seed file contains no listings; no changes made');
    return;
  }

  await ListingModel.bulkWrite(listings.map(({ id, ...listing }) => {
    const publicId = id || `lst_${randomUUID()}`;
    return {
      updateOne: {
        filter: { publicId },
        update: { $set: listing, $setOnInsert: { publicId } },
        upsert: true,
      },
    };
  }));

  logger.info({ count: listings.length, filePath }, 'Listings seeded');
}

seed()
  .catch((error) => {
    logger.error({ err: error }, 'Listing seed failed');
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
