import { randomUUID } from 'node:crypto';
import { HotelRoomTypeModel } from '../../models/hotel-room-type.model.js';
import { ListingModel } from '../../models/listing.model.js';
import { BOOKABLE_LISTING_TYPES } from '../bookings/booking.service.js';
import { listingSeedSchema } from './listing.schemas.js';

/**
 * Idempotently upserts listings by public ID. Bookable listings (hotel/homestay) without a room type get one
 * default room so they can be booked; existing rooms are never touched on re-runs.
 */
export async function seedListings(input: unknown) {
  const listings = listingSeedSchema.parse(input);
  let roomsCreated = 0;
  for (const { id, ...fields } of listings) {
    const publicId = id || `lst_${randomUUID()}`;
    const listing = await ListingModel.findOneAndUpdate(
      { publicId },
      { $set: { ...fields, priceMinor: Math.round(fields.price * 100) }, $setOnInsert: { publicId } },
      { upsert: true, returnDocument: 'after' },
    );
    if (await ensureDefaultRoom(listing)) roomsCreated += 1;
  }
  return { listings: listings.length, roomsCreated };
}

/** Gives a hotel/homestay without any room type a default one. Returns true when a room was created. */
async function ensureDefaultRoom(listing: any) {
  if (!BOOKABLE_LISTING_TYPES.includes(listing.type)) return false;
  if (await HotelRoomTypeModel.exists({ listingId: listing._id, deletedAt: null })) return false;
  const specs = listing.hotelSpecs ?? listing.homestaySpecs;
  await HotelRoomTypeModel.create({
    listingId: listing._id, name: 'Standard Room', bedType: 'Double', maxAdults: 2, maxChildren: 1,
    totalRooms: Math.max(1, specs?.roomsAvailable ?? 1), basePriceMinor: Math.round(listing.price * 100),
    amenities: specs?.amenities ?? [],
  });
  return true;
}

/** Makes listings seeded before room types existed bookable. Safe to re-run. */
export async function backfillDefaultRooms() {
  const listings = await ListingModel.find({ type: { $in: BOOKABLE_LISTING_TYPES }, deletedAt: null });
  let roomsCreated = 0;
  for (const listing of listings) if (await ensureDefaultRoom(listing)) roomsCreated += 1;
  return { listings: listings.length, roomsCreated };
}
