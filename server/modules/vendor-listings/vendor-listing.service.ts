import { connectDatabase } from "../../database/connection.js";
import { inTransaction } from "../../database/transaction.js";
import { HotelRoomTypeModel } from "../../models/hotel-room-type.model.js";
import { ListingModel, latLng } from "../../models/listing.model.js";
import { MediaModel } from "../../models/media.model.js";
import { VendorMemberModel } from "../../models/vendor-member.model.js";
import { VendorModel } from "../../models/vendor.model.js";
import { RoomNightModel } from "../../models/room-night.model.js";
import { AppError, ServiceUnavailableError } from "../../shared/app-error.js";
import { recordAuditEvent } from "../audit/audit.service.js";
import type { SessionMetadata } from "../auth/auth.service.js";
import {
  inventoryExceeds,
  prepareRoomNights,
} from "../bookings/availability.service.js";
import { todayInPakistan } from "../bookings/stay-dates.js";
import { notifyVendorDecision } from "../vendors/vendor-notifications.js";
import { canAccess } from "../vendors/member-access.js";

async function requireDatabase() {
  if (!(await connectDatabase()))
    throw new ServiceUnavailableError(
      "Listing management is unavailable while the database is disconnected.",
    );
}

const publicPhotos = (photos: any[] = []) =>
  photos.map((photo) => ({
    url: photo.url,
    ...(photo.caption ? { caption: photo.caption } : {}),
  }));

/** Listings created before photos existed only have `images`; treat those as uncaptioned photos. */
export function photosOf(listing: any) {
  if (listing.photos?.length)
    return listing.photos.map((photo: any) => photo.toObject?.() ?? photo);
  const images: string[] = listing.images ?? [];
  const ids =
    listing.imageMediaIds?.length === images.length
      ? listing.imageMediaIds
      : [];
  return images.map((url, index) => ({
    url,
    ...(ids[index] ? { mediaId: ids[index] } : {}),
  }));
}

function revisionView(revision: any) {
  if (!revision?.submittedAt) return undefined;
  const { photos, ...changes } = revision.changes ?? {};
  return {
    changes: {
      ...changes,
      ...(photos ? { photos: publicPhotos(photos) } : {}),
    },
    submittedAt: revision.submittedAt,
  };
}

function listingView(listing: any) {
  return {
    id: listing.publicId,
    type: listing.type,
    title: listing.title,
    location: listing.location,
    description: listing.description,
    price: listing.price,
    currency: listing.currency,
    image: listing.image,
    images: listing.images ?? [],
    photos: publicPhotos(photosOf(listing)),
    hotelSpecs: listing.hotelSpecs,
    homestaySpecs: listing.homestaySpecs,
    carSpecs: listing.carSpecs,
    tourSpecs: listing.tourSpecs,
    departures: listing.departures,
    coordinates: latLng(listing.coordinates),
    stayInfo: listing.stayInfo,
    status: listing.status,
    rejectionReason: listing.rejectionReason,
    pendingRevision: revisionView(listing.pendingRevision),
    revisionRejectionReason: listing.revisionRejectionReason || undefined,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
  };
}

/** Homestay pages read amenities and house rules from homestaySpecs; derive them from the shared hotelSpecs input. */
function homestaySpecsFor(listing: any, input: any) {
  const specs = listing.hotelSpecs ?? {};
  return {
    ...homestayContent(listing),
    ...input,
    amenities: specs.amenities ?? [],
    houseRules: specs.policies ?? [],
  };
}

/** The host-entered homestay fields (amenities and house rules are derived from hotelSpecs). */
function homestayContent(listing: any) {
  const specs =
    listing.homestaySpecs?.toObject?.() ?? listing.homestaySpecs ?? {};
  return {
    hostName: specs.hostName,
    experienceType: specs.experienceType,
    stayType: specs.stayType ?? "rooms",
    hostBio: specs.hostBio,
    hostImage: specs.hostImage,
    languages: [...(specs.languages ?? [])],
    familyOnSite: Boolean(specs.familyOnSite),
    meals: (specs.meals ?? []).map(({ type, included, price }: any) => ({
      type,
      included,
      price: included ? 0 : price,
    })),
  };
}

/** Swaps the uploaded host photo for its stored URL; an unchanged photo must be the one the listing already has. */
async function resolveHomestayInput(userId: string, listing: any, input: any) {
  if (!input) return undefined;
  const { hostPhoto, ...specs } = input;
  const known = [
    listing?.homestaySpecs?.hostImage,
    listing?.pendingRevision?.changes?.homestaySpecs?.hostImage,
  ]
    .filter(Boolean)
    .map((url) => ({ url }));
  const hostImage = hostPhoto
    ? (await resolvePhotos(userId, [hostPhoto], known))[0].url
    : undefined;
  return {
    ...specs,
    hostImage,
    meals: specs.meals?.map((meal: any) => ({
      ...meal,
      price: meal.included ? 0 : meal.price,
    })),
  };
}

/** Car specs as stored: `withDriver` mirrors the driver mode for older readers. */
const carSpecsFor = (specs: any) => specs && { ...specs, withDriver: specs.driverMode !== "self_drive" };

/**
 * A car's fleet entry mirrors its name, type and seats; bookings check the party size against its seats.
 * A tour's unit is one seat per traveller (adult or child), so its count is the seats per departure.
 */
async function syncCarUnit(listing: any, session?: any) {
  if (listing.type === "tour") {
    await HotelRoomTypeModel.updateMany(
      { listingId: listing._id, deletedAt: null },
      { $set: { name: listing.title, bedType: listing.tourSpecs?.category ?? "Tour", maxAdults: 1, maxChildren: 1 } },
      { session: session ?? null },
    );
    return;
  }
  if (listing.type !== "car" || !listing.carSpecs?.seats) return;
  await HotelRoomTypeModel.updateMany(
    { listingId: listing._id, deletedAt: null },
    { $set: { name: listing.title, bedType: listing.carSpecs.category, maxAdults: listing.carSpecs.seats, maxChildren: 0 } },
    { session: session ?? null },
  );
}

const toGeoPoint = (point?: { lat: number; lng: number }) =>
  point && { type: "Point", coordinates: [point.lng, point.lat] };

/** A homestay let as a whole has exactly one booking unit (one room type with a count of 1); a car listing has one fleet entry (any count). */
function assertEntireHome(
  listing: any,
  input: { totalRooms?: number },
  otherRooms = 0,
) {
  if ((listing.type === "car" || listing.type === "tour") && otherRooms > 0)
    throw new AppError(
      409,
      "SINGLE_UNIT",
      listing.type === "tour"
        ? "A tour has one seat entry. Change its seats or price instead, or list a different tour separately."
        : "A car listing has one fleet entry. Change its count instead, or list a different car separately.",
    );
  if (listing.homestaySpecs?.stayType !== "entire_home") return;
  if (otherRooms > 0)
    throw new AppError(
      409,
      "ENTIRE_HOME_SINGLE_UNIT",
      "A home let as a whole has one booking unit. Edit the existing one instead.",
    );
  if (input.totalRooms !== undefined && input.totalRooms !== 1)
    throw new AppError(
      422,
      "ENTIRE_HOME_SINGLE_UNIT",
      "A home let as a whole is one unit; set the count to 1.",
    );
}

function roomView(room: any) {
  const revision = room.pendingRevision;
  const { photos, ...changes } = revision?.changes ?? {};
  return {
    id: room.publicId,
    name: room.name,
    description: room.description,
    bedType: room.bedType,
    maxAdults: room.maxAdults,
    maxChildren: room.maxChildren,
    totalRooms: room.totalRooms,
    basePrice: room.basePriceMinor / 100,
    ...(room.weekendPriceMinor != null ? { weekendPrice: room.weekendPriceMinor / 100 } : {}),
    seasons: (room.seasons ?? []).map((season: any) => ({ name: season.name, from: season.from, to: season.to, price: season.priceMinor / 100 })),
    amenities: room.amenities ?? [],
    photos: publicPhotos(room.photos),
    status: room.status,
    ...(revision
      ? {
          pendingRevision: {
            changes: {
              ...changes,
              ...(photos ? { photos: publicPhotos(photos) } : {}),
            },
            isNew: Boolean(revision.isNew),
          },
        }
      : {}),
  };
}

async function approvedVendor(userId: string) {
  await requireDatabase();
  const membership = await VendorMemberModel.findOne({
    userId,
    status: "active",
    deletedAt: null,
  });
  if (!membership || !canAccess(membership.role, "listings")) {
    throw new AppError(
      403,
      "VENDOR_ACCESS_REQUIRED",
      "An active vendor listing role is required.",
    );
  }
  const vendor = await VendorModel.findOne({
    _id: membership.vendorId,
    status: "approved",
    deletedAt: null,
  });
  if (!vendor)
    throw new AppError(
      403,
      "VENDOR_APPROVAL_REQUIRED",
      "The vendor must be approved before managing listings.",
    );
  return vendor;
}

async function ownedListing(userId: string, listingId: string) {
  const vendor = await approvedVendor(userId);
  const listing = await ListingModel.findOne({
    publicId: listingId,
    ownerId: vendor._id,
    deletedAt: null,
  });
  if (!listing)
    throw new AppError(
      404,
      "LISTING_NOT_FOUND",
      "Owned listing was not found.",
    );
  return { vendor, listing };
}

async function ownedImages(userId: string, imageIds: string[]) {
  const records = await MediaModel.find({
    publicId: { $in: imageIds },
    ownerId: userId,
    resourceType: "image",
    status: "ready",
    deletedAt: null,
  });
  if (records.length !== new Set(imageIds).size)
    throw new AppError(
      400,
      "INVALID_LISTING_MEDIA",
      "Every listing image must be a ready image owned by this user.",
    );
  const byId = new Map(records.map((record: any) => [record.publicId, record]));
  return imageIds.map((id) => byId.get(id));
}

/** Turns photo input into stored photos: new uploads must be owned, existing ones must already belong to this listing/room. */
async function resolvePhotos(
  userId: string,
  input: { mediaId?: string; url?: string; caption?: string }[],
  known: any[],
) {
  const byUrl = new Map(known.map((photo) => [photo.url, photo]));
  const uploads = await ownedImages(
    userId,
    input.flatMap((photo) => (photo.mediaId ? [photo.mediaId] : [])),
  );
  let next = 0;
  return input.map((photo) => {
    const source = photo.mediaId
      ? { url: uploads[next].url, mediaId: uploads[next++]._id }
      : byUrl.get(photo.url!);
    if (!source)
      throw new AppError(
        400,
        "INVALID_LISTING_MEDIA",
        "A photo does not belong to this property. Upload it again.",
      );
    return {
      url: source.url,
      ...(source.mediaId ? { mediaId: source.mediaId } : {}),
      ...(photo.caption ? { caption: photo.caption } : {}),
    };
  });
}

function setListingPhotos(listing: any, photos: any[]) {
  listing.photos = photos;
  listing.images = photos.map((photo) => photo.url);
  listing.image = photos[0]?.url ?? listing.image;
  listing.imageMediaIds = photos.flatMap((photo) =>
    photo.mediaId ? [photo.mediaId] : [],
  );
}

// What guests read. Edits to these on a live listing (or its rooms) wait for review; everything else applies at once.
const listingContent = (listing: any) => ({
  title: listing.title,
  location: listing.location,
  description: listing.description,
  hotelSpecs: listing.hotelSpecs && {
    hotelType: listing.hotelSpecs.hotelType,
    amenities: [...(listing.hotelSpecs.amenities ?? [])],
    facilities: [...(listing.hotelSpecs.facilities ?? [])],
    policies: [...(listing.hotelSpecs.policies ?? [])],
    checkInTime: listing.hotelSpecs.checkInTime,
    checkOutTime: listing.hotelSpecs.checkOutTime,
  },
  homestaySpecs:
    listing.type === "homestay" ? homestayContent(listing) : undefined,
  carSpecs: listing.type === "car" ? (listing.carSpecs?.toObject?.() ?? listing.carSpecs) : undefined,
  tourSpecs: listing.type === "tour" ? (listing.tourSpecs?.toObject?.() ?? listing.tourSpecs) : undefined,
  coordinates: listing.coordinates?.toObject?.() ?? listing.coordinates,
  stayInfo: listing.stayInfo?.toObject?.() ?? listing.stayInfo,
  photos: photosOf(listing),
});
const roomContent = (room: any) => ({
  name: room.name,
  description: room.description,
  bedType: room.bedType,
  maxAdults: room.maxAdults,
  maxChildren: room.maxChildren,
  amenities: [...(room.amenities ?? [])],
  photos: (room.photos ?? []).map((photo: any) => photo.toObject?.() ?? photo),
});

const comparable = (value: any): string =>
  JSON.stringify(value, (key, item) => {
    if (key === "mediaId") return undefined;
    if (item && typeof item === "object" && !Array.isArray(item))
      return Object.fromEntries(
        Object.keys(item)
          .sort()
          .map((name) => [name, item[name] ?? null]),
      );
    return item ?? null;
  });

/** Folds new edits into a pending revision, keeping only fields that still differ from the live version. */
function mergeRevision(
  live: Record<string, any>,
  pending: Record<string, any> | undefined,
  edits: Record<string, any>,
) {
  const merged = { ...pending, ...edits };
  return Object.fromEntries(
    Object.entries(merged).filter(
      ([key, value]) =>
        value !== undefined && comparable(value) !== comparable(live[key]),
    ),
  );
}

function applyListingChanges(listing: any, changes: Record<string, any>) {
  const { photos, homestaySpecs, ...fields } = changes;
  Object.assign(listing, fields);
  if (photos) setListingPhotos(listing, photos);
  if (listing.type === "homestay")
    listing.homestaySpecs = homestaySpecsFor(listing, homestaySpecs);
}

const hasRevision = (listing: any) =>
  Boolean(listing.pendingRevision?.submittedAt);

/** Marks the listing as having changes in review (its own, or only its rooms'). */
function touchRevision(listing: any, changes?: Record<string, any>) {
  listing.pendingRevision = {
    changes: changes ?? listing.pendingRevision?.changes ?? {},
    submittedAt: new Date(),
  };
  listing.revisionRejectionReason = null;
  listing.markModified("pendingRevision");
}

export async function listOwnListings(userId: string) {
  const vendor = await approvedVendor(userId);
  const records = await ListingModel.find({
    ownerId: vendor._id,
    deletedAt: null,
  })
    .sort({ updatedAt: -1 })
    .lean();
  return records.map(listingView);
}

// Partner account type → what it may list. Multi-service partners may list everything.
const LISTING_TYPE_FOR: Record<string, string> = { hotel: "hotel", homestay: "homestay", vehicle: "car", tour_operator: "tour" };
const ACCOUNT_NAME: Record<string, string> = { hotel: "a hotel business", homestay: "a homestay host", vehicle: "a car rental partner", tour_operator: "a tour partner" };
const ACCOUNT_NEEDED: Record<string, string> = { car: "Cars need a car rental", homestay: "Homestays need a homestay host", tour: "Tours need a tour partner", hotel: "Hotels need a hotel business" };

/** Fixed-departure dates, sorted; only tours keep them. */
const departuresFor = (type: string, dates?: string[]) => (type === "tour" && dates ? [...new Set(dates)].sort() : undefined);

/** One account is one partner type: hotels, homestays or cars. */
function assertListingTypeAllowed(vendor: any, type: string) {
  if (LISTING_TYPE_FOR[vendor.businessType] === type || vendor.businessType === "multi_service")
    return;
  throw new AppError(
    403,
    "LISTING_TYPE_NOT_ALLOWED",
    `Your partner account is registered as ${ACCOUNT_NAME[vendor.businessType] ?? "another partner type"}. ${ACCOUNT_NEEDED[type] ?? ACCOUNT_NEEDED.hotel} registration.`,
  );
}

export async function createHotelListing(
  userId: string,
  input: any,
  metadata: SessionMetadata,
) {
  const vendor = await approvedVendor(userId);
  assertListingTypeAllowed(vendor, input.type);
  const photos = await resolvePhotos(
    userId,
    input.photos ?? input.imageIds.map((id: string) => ({ mediaId: id })),
    [],
  );
  const listing = new ListingModel({
    ownerId: vendor._id,
    type: input.type,
    title: input.title,
    location: input.location,
    description: input.description,
    price: input.price,
    priceMinor: input.price * 100,
    hotelSpecs: input.type === "car" || input.type === "tour" ? undefined : input.hotelSpecs,
    carSpecs: input.type === "car" ? carSpecsFor(input.carSpecs) : undefined,
    tourSpecs: input.type === "tour" ? input.tourSpecs : undefined,
    departures: departuresFor(input.type, input.departures),
    coordinates: toGeoPoint(input.coordinates),
    stayInfo: input.stayInfo,
    status: "draft",
    featured: false,
  });
  setListingPhotos(listing, photos);
  if (listing.type === "homestay")
    listing.homestaySpecs = homestaySpecsFor(
      listing,
      await resolveHomestayInput(userId, null, input.homestaySpecs),
    );
  await listing.save();
  await recordAuditEvent({
    actorId: userId,
    actorType: "user",
    action: "listing.created",
    resourceType: "listing",
    resourceId: listing.publicId,
    ...metadata,
  });
  return listingView(listing);
}

/** Draft and rejected listings change directly. Live ones stay bookable as published; the edit waits as a pending revision. */
export async function updateHotelListing(
  userId: string,
  listingId: string,
  input: any,
  metadata: SessionMetadata,
) {
  const { listing } = await ownedListing(userId, listingId);
  if (!["draft", "rejected", "published", "paused"].includes(listing.status))
    throw new AppError(
      409,
      "LISTING_LOCKED",
      "Listings cannot be edited while under review.",
    );
  const { price, imageIds, photos, departures, ...edits } = input;
  // Each listing type keeps its own spec block.
  if (listing.type === "car" || listing.type === "tour") delete edits.hotelSpecs;
  if (listing.type !== "tour") delete edits.tourSpecs;
  // Departure dates are day-to-day operations, like price: they apply at once.
  if (departures && listing.type === "tour") listing.departures = departuresFor("tour", departures);
  if (edits.carSpecs) {
    if (listing.type === "car") edits.carSpecs = carSpecsFor(edits.carSpecs);
    else delete edits.carSpecs;
  }
  if (edits.homestaySpecs)
    edits.homestaySpecs = {
      ...homestayContent(listing),
      ...(await resolveHomestayInput(userId, listing, edits.homestaySpecs)),
    };
  if (edits.coordinates) edits.coordinates = toGeoPoint(edits.coordinates);
  if (price !== undefined) {
    listing.price = price;
    listing.priceMinor = price * 100;
  }
  const pending = listing.pendingRevision?.changes;
  const photoInput = photos ?? imageIds?.map((id: string) => ({ mediaId: id }));
  if (photoInput)
    edits.photos = await resolvePhotos(userId, photoInput, [
      ...photosOf(listing),
      ...(pending?.photos ?? []),
    ]);
  const live = ["published", "paused"].includes(listing.status);
  if (live) {
    const changes = mergeRevision(listingContent(listing), pending, edits);
    const roomsPending = await HotelRoomTypeModel.exists({
      listingId: listing._id,
      pendingRevision: { $exists: true },
      deletedAt: null,
    });
    if (Object.keys(changes).length || roomsPending)
      touchRevision(listing, changes);
    else {
      listing.pendingRevision = undefined;
      listing.revisionRejectionReason = null;
    }
  } else {
    applyListingChanges(listing, edits);
    Object.assign(listing, { status: "draft", rejectionReason: null });
  }
  await listing.save();
  if (!live) await syncCarUnit(listing);
  await recordAuditEvent({
    actorId: userId,
    actorType: "user",
    action: live ? "listing.revision_submitted" : "listing.updated",
    resourceType: "listing",
    resourceId: listing.publicId,
    ...metadata,
  });
  return listingView(listing);
}

export async function addRoomType(
  userId: string,
  listingId: string,
  input: any,
  metadata: SessionMetadata,
) {
  const { listing } = await ownedListing(userId, listingId);
  const live = ["published", "paused"].includes(listing.status);
  if (!live && !["draft", "rejected"].includes(listing.status))
    throw new AppError(
      409,
      "LISTING_LOCKED",
      "Room types cannot change while the listing is under review.",
    );
  assertEntireHome(
    listing,
    input,
    await HotelRoomTypeModel.countDocuments({
      listingId: listing._id,
      deletedAt: null,
      status: { $ne: "archived" },
    }),
  );
  const { basePrice, photos, weekendPrice, seasons, ...fields } = input;
  const room = await HotelRoomTypeModel.create({
    listingId: listing._id,
    ...fields,
    basePriceMinor: basePrice * 100,
    ...priceRulesMinor({ weekendPrice, seasons }),
    photos: photos ? await resolvePhotos(userId, photos, []) : [],
    // A room added to a live hotel stays hidden (paused) until the revision is approved.
    ...(live
      ? { status: "paused", pendingRevision: { changes: {}, isNew: true } }
      : {}),
  });
  if (live) {
    touchRevision(listing);
    await listing.save();
  }
  // Tours: one seat per traveller, whatever the client sent.
  if (listing.type === "tour") await syncCarUnit(listing);
  await syncListingPrice(listing);
  await recordAuditEvent({
    actorId: userId,
    actorType: "user",
    action: "listing.room_created",
    resourceType: "listing",
    resourceId: listing.publicId,
    ...metadata,
    metadata: { roomId: room.publicId },
  });
  return roomView(room);
}

export async function listRoomTypes(userId: string, listingId: string) {
  const { listing } = await ownedListing(userId, listingId);
  const rooms = await HotelRoomTypeModel.find({
    listingId: listing._id,
    deletedAt: null,
  })
    .sort({ createdAt: 1 })
    .lean();
  return rooms.map(roomView);
}

/** Keeps the listing's "from" price, used by search, equal to its cheapest bookable room. */
async function syncListingPrice(listing: any) {
  const cheapest = (await HotelRoomTypeModel.findOne({
    listingId: listing._id,
    status: "active",
    deletedAt: null,
  })
    .sort({ basePriceMinor: 1 })
    .select("basePriceMinor")
    .lean()) as any;
  if (!cheapest || cheapest.basePriceMinor === listing.priceMinor) return;
  listing.priceMinor = cheapest.basePriceMinor;
  listing.price = cheapest.basePriceMinor / 100;
  await listing.save();
}

// Price, inventory and pausing are day-to-day operations and apply at once; on a live listing, what guests read waits for review.
const LIVE_ROOM_FIELDS = ["basePrice", "weekendPrice", "seasons", "totalRooms", "status"];

/** Weekend and season prices in minor units; like the base price they apply at once, without review. */
function priceRulesMinor(input: { weekendPrice?: number | null; seasons?: Array<{ name: string; from: string; to: string; price: number }> }) {
  return {
    ...(input.weekendPrice !== undefined ? { weekendPriceMinor: input.weekendPrice === null ? null : input.weekendPrice * 100 } : {}),
    ...(input.seasons ? { seasons: input.seasons.map(({ price, ...season }) => ({ ...season, priceMinor: price * 100 })) } : {}),
  };
}

export async function updateRoomType(
  userId: string,
  listingId: string,
  roomId: string,
  input: any,
  metadata: SessionMetadata,
) {
  const { listing } = await ownedListing(userId, listingId);
  const live = ["published", "paused"].includes(listing.status);
  if (!live && !["draft", "rejected"].includes(listing.status))
    throw new AppError(
      409,
      "LISTING_LOCKED",
      "Room types cannot change while the listing is under review.",
    );
  const current = await HotelRoomTypeModel.findOne({
    publicId: roomId,
    listingId: listing._id,
    deletedAt: null,
  });
  if (!current)
    throw new AppError(404, "ROOM_TYPE_NOT_FOUND", "Room type was not found.");
  assertEntireHome(listing, input);
  if (current.pendingRevision?.isNew && input.status === "active") {
    throw new AppError(
      409,
      "ROOM_AWAITING_REVIEW",
      "This room category goes live once GBBookings approves it.",
    );
  }
  const { photos, ...fields } = input;
  const update: Record<string, any> = {};
  const edits: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields))
    (LIVE_ROOM_FIELDS.includes(key) ? update : edits)[key] = value;
  if (update.basePrice !== undefined) {
    update.basePriceMinor = update.basePrice * 100;
    delete update.basePrice;
  }
  Object.assign(update, priceRulesMinor(update));
  delete update.weekendPrice;
  delete update.seasons;
  const pending = current.pendingRevision?.changes;
  if (photos)
    edits.photos = await resolvePhotos(userId, photos, [
      ...(current.photos ?? []),
      ...(pending?.photos ?? []),
    ]);
  let revisionTouched = false;
  const unset: Record<string, 1> = {};
  if (live) {
    const changes = mergeRevision(roomContent(current), pending, edits);
    if (Object.keys(changes).length || current.pendingRevision?.isNew) {
      update.pendingRevision = { ...current.pendingRevision, changes };
      revisionTouched = true;
    } else if (current.pendingRevision) {
      unset.pendingRevision = 1;
      revisionTouched = true;
    }
  } else {
    Object.assign(update, edits);
  }
  const room = await inTransaction(async (session) => {
    const room = await HotelRoomTypeModel.findOneAndUpdate(
      { _id: current._id, deletedAt: null },
      {
        $set: update,
        ...(revisionTouched && unset.pendingRevision ? { $unset: unset } : {}),
        $inc: { inventoryVersion: 1 },
      },
      { session, returnDocument: "after", runValidators: true },
    );
    if (!room)
      throw new AppError(
        404,
        "ROOM_TYPE_NOT_FOUND",
        "Room type was not found.",
      );
    if (
      input.totalRooms !== undefined &&
      (await inventoryExceeds(
        room._id,
        input.totalRooms,
        todayInPakistan(),
        session,
      ))
    ) {
      throw new AppError(
        409,
        "INVENTORY_BELOW_BOOKINGS",
        "Room count cannot be lower than existing reservations plus closed rooms on any upcoming night.",
      );
    }
    return room;
  });
  if (revisionTouched) await refreshRevisionFlag(listing);
  await syncListingPrice(listing);
  await recordAuditEvent({
    actorId: userId,
    actorType: "user",
    action: "listing.room_updated",
    resourceType: "listing",
    resourceId: listing.publicId,
    ...metadata,
    metadata: { roomId: room.publicId, ...fields },
  });
  return roomView(room);
}

/** Keeps the listing's review flag in step after a room edit: set while it or any room has changes waiting. */
async function refreshRevisionFlag(listing: any) {
  const own = Object.keys(listing.pendingRevision?.changes ?? {}).length > 0;
  const rooms = await HotelRoomTypeModel.exists({
    listingId: listing._id,
    pendingRevision: { $exists: true },
    deletedAt: null,
  });
  if (own || rooms) touchRevision(listing);
  else if (hasRevision(listing)) listing.pendingRevision = undefined;
  else return;
  await listing.save();
}

const DAY_MS = 86_400_000;
const MAX_CALENDAR_DAYS = 120;

function dateRange(from: string, to: string) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const days = Math.round((Date.parse(`${to}T00:00:00Z`) - start) / DAY_MS) + 1;
  if (!Number.isFinite(days) || days < 1)
    throw new AppError(
      400,
      "INVALID_DATE_RANGE",
      "The end date must be on or after the start date.",
    );
  if (days > MAX_CALENDAR_DAYS)
    throw new AppError(
      400,
      "INVALID_DATE_RANGE",
      `Choose at most ${MAX_CALENDAR_DAYS} days at a time.`,
    );
  return Array.from({ length: days }, (_, index) =>
    new Date(start + index * DAY_MS).toISOString().slice(0, 10),
  );
}

async function ownedRoom(userId: string, listingId: string, roomId: string) {
  const { listing } = await ownedListing(userId, listingId);
  const room = await HotelRoomTypeModel.findOne({
    publicId: roomId,
    listingId: listing._id,
    deletedAt: null,
  });
  if (!room)
    throw new AppError(404, "ROOM_TYPE_NOT_FOUND", "Room type was not found.");
  return { listing, room };
}

/** Per-night inventory for one room category: booked, closed by the property, and still available. */
export async function getRoomCalendar(
  userId: string,
  listingId: string,
  roomId: string,
  from: string,
  to: string,
) {
  const { room } = await ownedRoom(userId, listingId, roomId);
  const dates = dateRange(from, to);
  const counters = (await RoomNightModel.find({
    roomTypeId: room._id,
    date: { $in: dates },
  })
    .select("date booked closed")
    .lean()) as any[];
  const byDate = new Map(counters.map((counter) => [counter.date, counter]));
  return {
    roomId: room.publicId,
    totalRooms: room.totalRooms,
    days: dates.map((date) => {
      const booked = byDate.get(date)?.booked ?? 0;
      const closed = byDate.get(date)?.closed ?? 0;
      return {
        date,
        booked,
        closed,
        available: Math.max(0, room.totalRooms - booked - closed),
      };
    }),
  };
}

/** Takes `closed` rooms out of sale for every night from..to (0 reopens them). Never closes rooms guests already hold. */
export async function setRoomClosures(
  userId: string,
  listingId: string,
  roomId: string,
  input: { from: string; to: string; closed: number },
  metadata: SessionMetadata,
) {
  const { listing, room } = await ownedRoom(userId, listingId, roomId);
  if (input.from < todayInPakistan())
    throw new AppError(
      400,
      "INVALID_DATE_RANGE",
      "Past dates cannot be changed.",
    );
  if (input.closed > room.totalRooms)
    throw new AppError(
      400,
      "INVALID_CLOSURE",
      `This category only has ${room.totalRooms} room(s).`,
    );
  const dates = dateRange(input.from, input.to);
  await prepareRoomNights(room._id, dates);
  await inTransaction(async (session) => {
    // Writing the room document serializes closures with concurrent reservations of this category.
    await HotelRoomTypeModel.updateOne(
      { _id: room._id },
      { $inc: { inventoryVersion: 1 } },
      { session },
    );
    const conflicts: string[] = [];
    for (const date of dates) {
      const result = await RoomNightModel.updateOne(
        {
          roomTypeId: room._id,
          date,
          booked: { $lte: room.totalRooms - input.closed },
        },
        { $set: { closed: input.closed } },
        { session },
      );
      if (result.matchedCount !== 1) conflicts.push(date);
    }
    if (conflicts.length) {
      throw new AppError(
        409,
        "CLOSURE_CONFLICTS_WITH_BOOKINGS",
        `Guests already hold rooms on ${conflicts.slice(0, 5).join(", ")}${conflicts.length > 5 ? ` and ${conflicts.length - 5} more night(s)` : ""}. Close fewer rooms on those nights.`,
        { dates: conflicts },
      );
    }
  });
  await recordAuditEvent({
    actorId: userId,
    actorType: "user",
    action: "listing.room_closures_set",
    resourceType: "listing",
    resourceId: listing.publicId,
    ...metadata,
    metadata: { roomId: room.publicId, ...input },
  });
  return getRoomCalendar(userId, listingId, roomId, input.from, input.to);
}

export async function archiveRoomType(
  userId: string,
  listingId: string,
  roomId: string,
) {
  const { listing } = await ownedListing(userId, listingId);
  const editable = ["draft", "rejected"].includes(listing.status);
  const room = await HotelRoomTypeModel.findOneAndUpdate(
    // On a live hotel only a room still waiting for its first approval can be withdrawn.
    {
      publicId: roomId,
      listingId: listing._id,
      deletedAt: null,
      ...(editable ? {} : { "pendingRevision.isNew": true }),
    },
    {
      $set: { status: "archived", deletedAt: new Date() },
      $unset: { pendingRevision: 1 },
    },
  );
  if (!room) {
    throw editable || !["published", "paused"].includes(listing.status)
      ? new AppError(
          editable ? 404 : 409,
          editable ? "ROOM_TYPE_NOT_FOUND" : "LISTING_LOCKED",
          editable
            ? "Room type was not found."
            : "Room types cannot change while the listing is under review.",
        )
      : new AppError(
          409,
          "LISTING_LOCKED",
          "Live room categories can be paused, not removed.",
        );
  }
  if (!editable) await refreshRevisionFlag(listing);
  await syncListingPrice(listing);
}

export async function submitListing(
  userId: string,
  listingId: string,
  metadata: SessionMetadata,
) {
  const { listing } = await ownedListing(userId, listingId);
  if (!["draft", "rejected"].includes(listing.status))
    throw new AppError(
      409,
      "INVALID_LISTING_STATUS",
      "This listing cannot be submitted.",
    );
  const rooms = await HotelRoomTypeModel.countDocuments({
    listingId: listing._id,
    status: "active",
    deletedAt: null,
  });
  if (!listing.imageMediaIds.length || rooms === 0)
    throw new AppError(
      400,
      "LISTING_INCOMPLETE",
      listing.type === "car"
        ? "Add at least one photo and the car's daily price and count before submission."
        : listing.type === "tour"
          ? "Add at least one photo and the tour's price and seats before submission."
          : "Add at least one owned image and one active room type before submission.",
    );
  if (!listing.stayInfo?.paymentMethods?.length)
    throw new AppError(
      400,
      "LISTING_INCOMPLETE",
      listing.type === "car" || listing.type === "tour"
        ? `Choose how guests can pay ${listing.type === "car" ? "at pickup" : "at the start of the tour"} before submission.`
        : 'Fill in "Policies & essentials" (payment, children, heating, road access…) before submission.',
    );
  if (
    listing.homestaySpecs?.stayType === "entire_home" &&
    (rooms !== 1 ||
      (await HotelRoomTypeModel.exists({
        listingId: listing._id,
        deletedAt: null,
        totalRooms: { $ne: 1 },
      })))
  ) {
    throw new AppError(
      400,
      "LISTING_INCOMPLETE",
      "A home let as a whole needs exactly one booking unit with a count of 1.",
    );
  }
  if (
    listing.tourSpecs?.schedule === "fixed" &&
    !(listing.departures ?? []).some((date: string) => date >= todayInPakistan())
  )
    throw new AppError(
      400,
      "LISTING_INCOMPLETE",
      "Add at least one upcoming departure date before submission.",
    );
  listing.status = "submitted";
  listing.rejectionReason = null;
  await listing.save();
  await recordAuditEvent({
    actorId: userId,
    actorType: "user",
    action: "listing.submitted",
    resourceType: "listing",
    resourceId: listing.publicId,
    ...metadata,
  });
  return listingView(listing);
}

/** Pausing hides a live listing from search and new bookings; existing reservations are unaffected. */
export async function setListingAvailability(
  userId: string,
  listingId: string,
  status: "paused" | "published",
  metadata: SessionMetadata,
) {
  const { listing } = await ownedListing(userId, listingId);
  const from = status === "paused" ? "published" : "paused";
  if (listing.status !== from)
    throw new AppError(
      409,
      "INVALID_LISTING_STATUS",
      status === "paused"
        ? "Only live listings can be paused."
        : "Only paused listings can be resumed.",
    );
  listing.status = status;
  await listing.save();
  await recordAuditEvent({
    actorId: userId,
    actorType: "user",
    action: status === "paused" ? "listing.paused" : "listing.resumed",
    resourceType: "listing",
    resourceId: listing.publicId,
    ...metadata,
  });
  return listingView(listing);
}

export async function archiveListing(
  userId: string,
  listingId: string,
  metadata: SessionMetadata,
) {
  const { listing } = await ownedListing(userId, listingId);
  listing.status = "archived";
  listing.deletedAt = new Date();
  await listing.save();
  await recordAuditEvent({
    actorId: userId,
    actorType: "user",
    action: "listing.archived",
    resourceType: "listing",
    resourceId: listing.publicId,
    ...metadata,
  });
}

export async function duplicateListing(
  userId: string,
  listingId: string,
  metadata: SessionMetadata,
) {
  const { vendor, listing } = await ownedListing(userId, listingId);
  assertListingTypeAllowed(vendor, listing.type);
  const source = listing.toObject();
  delete source._id;
  delete source.publicId;
  delete source.createdAt;
  delete source.updatedAt;
  delete source.pendingRevision;
  delete source.revisionRejectionReason;
  const duplicate = await ListingModel.create({
    ...source,
    ownerId: vendor._id,
    title: `${listing.title} Copy`,
    status: "draft",
    featured: false,
    rejectionReason: null,
    deletedAt: null,
  });
  const rooms = await HotelRoomTypeModel.find({
    listingId: listing._id,
    deletedAt: null,
  }).lean();
  if (rooms.length) {
    await HotelRoomTypeModel.insertMany(
      rooms.map((room: any) => {
        const {
          _id,
          publicId,
          createdAt,
          updatedAt,
          pendingRevision,
          ...fields
        } = room;
        return {
          ...fields,
          listingId: duplicate._id,
          status: "active",
          deletedAt: null,
        };
      }),
    );
  }
  await recordAuditEvent({
    actorId: userId,
    actorType: "user",
    action: "listing.duplicated",
    resourceType: "listing",
    resourceId: duplicate.publicId,
    ...metadata,
    metadata: { sourceListingId: listing.publicId },
  });
  return listingView(duplicate);
}

/** Admin view of vendor hotels and homestays in any state; the review queue is status=submitted (oldest first). */
export async function listListingsForModeration(query: {
  status: string;
  type?: string;
  q?: string;
  page: number;
  limit: number;
}) {
  await requireDatabase();
  const term =
    query.q && new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const filter: Record<string, unknown> = {
    type: query.type ?? { $in: ["hotel", "homestay", "car", "tour"] },
    ownerId: { $ne: null },
    // Archiving also sets deletedAt, so archived listings are only shown when asked for.
    ...(query.status === "archived"
      ? { status: "archived" }
      : query.status === "revisions"
        ? { deletedAt: null, "pendingRevision.submittedAt": { $exists: true } }
        : {
            deletedAt: null,
            ...(query.status === "all" ? {} : { status: query.status }),
          }),
    ...(term ? { $or: [{ title: term }, { location: term }] } : {}),
  };
  const [records, total] = await Promise.all([
    ListingModel.find(filter)
      .sort(
        query.status === "submitted"
          ? { updatedAt: 1 }
          : query.status === "revisions"
            ? { "pendingRevision.submittedAt": 1 }
            : { updatedAt: -1 },
      )
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    ListingModel.countDocuments(filter),
  ]);
  const vendors = (await VendorModel.find({
    _id: { $in: records.map((record: any) => record.ownerId) },
  })
    .select("name")
    .lean()) as any[];
  const vendorNames = new Map(
    vendors.map((vendor) => [String(vendor._id), vendor.name]),
  );
  return {
    data: records.map((record: any) => ({
      ...listingView(record),
      vendorName: vendorNames.get(String(record.ownerId)),
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit),
    },
  };
}

export async function listRoomsForModeration(listingId: string) {
  await requireDatabase();
  const listing = await ListingModel.findOne({
    publicId: listingId,
    deletedAt: null,
  });
  if (!listing)
    throw new AppError(404, "LISTING_NOT_FOUND", "Listing was not found.");
  const rooms = await HotelRoomTypeModel.find({
    listingId: listing._id,
    deletedAt: null,
  })
    .sort({ createdAt: 1 })
    .lean();
  return rooms.map(roomView);
}

export async function moderateListing(
  adminId: string,
  listingId: string,
  input: { decision: string; notes: string },
  metadata: SessionMetadata,
) {
  await requireDatabase();
  // Publishing needs a submitted listing; rejecting also takes down a live or paused one, returning it to the vendor.
  const from =
    input.decision === "published"
      ? ["submitted"]
      : ["submitted", "published", "paused"];
  const listing = await ListingModel.findOne({
    publicId: listingId,
    status: { $in: from },
    deletedAt: null,
  });
  if (!listing)
    throw new AppError(
      404,
      "LISTING_NOT_FOUND",
      input.decision === "published"
        ? "Submitted listing was not found."
        : "This listing cannot be rejected in its current state.",
    );
  if (input.decision === "published") {
    if (
      !(await VendorModel.exists({
        _id: listing.ownerId,
        status: "approved",
        deletedAt: null,
      }))
    ) {
      throw new AppError(
        409,
        "VENDOR_APPROVAL_REQUIRED",
        "Approve the property business before publishing its hotel.",
      );
    }
    if (
      !listing.imageMediaIds.length ||
      !(await HotelRoomTypeModel.exists({
        listingId: listing._id,
        status: "active",
        deletedAt: null,
      }))
    ) {
      throw new AppError(
        400,
        "LISTING_INCOMPLETE",
        "The hotel needs a property photo and an active room category before publication.",
      );
    }
  }
  const wasLive = listing.status !== "submitted";
  listing.status = input.decision;
  listing.rejectionReason = input.decision === "rejected" ? input.notes : null;
  // A taken-down listing is editable again, so any edits waiting for review simply become its draft content.
  await inTransaction(async (session) => {
    if (hasRevision(listing))
      await resolveRevision(listing, "approved", session);
    await listing.save({ session });
  });
  await recordAuditEvent({
    actorId: adminId,
    actorType: "user",
    action: `listing.${input.decision}`,
    resourceType: "listing",
    resourceId: listing.publicId,
    ...metadata,
    metadata: { notes: input.notes },
  });
  const vendor = await VendorModel.findById(listing.ownerId)
    .select("name email")
    .lean();
  if (vendor) {
    await notifyVendorDecision(
      vendor,
      input.decision === "published"
        ? "listing.published"
        : wasLive
          ? "listing.taken_down"
          : "listing.rejected",
      {
        hotel: listing.title,
        reason: input.decision === "rejected" ? input.notes : undefined,
      },
    );
  }
  return listingView(listing);
}

/** Applies (or discards) the listing's pending revision and its rooms' changes. The caller saves the listing. */
async function resolveRevision(
  listing: any,
  decision: "approved" | "rejected",
  session: any,
) {
  const rooms = await HotelRoomTypeModel.find({
    listingId: listing._id,
    pendingRevision: { $exists: true },
    deletedAt: null,
  }).session(session);
  for (const room of rooms) {
    const { changes = {}, isNew } = room.pendingRevision;
    const set =
      decision === "approved"
        ? { ...changes, ...(isNew ? { status: "active" } : {}) }
        : isNew
          ? { status: "archived", deletedAt: new Date() }
          : {};
    await HotelRoomTypeModel.updateOne(
      { _id: room._id },
      {
        $set: set,
        $unset: { pendingRevision: 1 },
        $inc: { inventoryVersion: 1 },
      },
      { session, runValidators: true },
    );
  }
  if (decision === "approved") {
    applyListingChanges(listing, listing.pendingRevision?.changes ?? {});
    await syncCarUnit(listing, session);
  }
  listing.pendingRevision = undefined;
}

export async function decideListingRevision(
  adminId: string,
  listingId: string,
  input: { decision: "approved" | "rejected"; notes: string },
  metadata: SessionMetadata,
) {
  await requireDatabase();
  const listing = await ListingModel.findOne({
    publicId: listingId,
    deletedAt: null,
    "pendingRevision.submittedAt": { $exists: true },
  });
  if (!listing)
    throw new AppError(
      404,
      "REVISION_NOT_FOUND",
      "This listing has no changes waiting for review.",
    );
  const changes = listing.pendingRevision.changes;
  listing.revisionRejectionReason =
    input.decision === "rejected" ? input.notes : null;
  await inTransaction(async (session) => {
    await resolveRevision(listing, input.decision, session);
    await listing.save({ session });
  });
  await syncListingPrice(listing);
  await recordAuditEvent({
    actorId: adminId,
    actorType: "user",
    action: `listing.revision_${input.decision}`,
    resourceType: "listing",
    resourceId: listing.publicId,
    ...metadata,
    metadata: { notes: input.notes, fields: Object.keys(changes ?? {}) },
  });
  const vendor = await VendorModel.findById(listing.ownerId)
    .select("name email")
    .lean();
  if (vendor) {
    await notifyVendorDecision(vendor, `listing.revision_${input.decision}`, {
      hotel: listing.title,
      reason: input.decision === "rejected" ? input.notes : undefined,
    });
  }
  return listingView(listing);
}
