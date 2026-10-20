import { randomUUID } from 'node:crypto';
import mongoose, { type Model } from 'mongoose';

const { Schema } = mongoose;

const itineraryItemSchema = new Schema({
  day: { type: Number, required: true, min: 1 },
  title: { type: String, required: true, trim: true },
  desc: { type: String, required: true, trim: true },
}, { _id: false });

const coordinatesSchema = new Schema({
  type: { type: String, enum: ['Point'], required: true },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: (value: number[]) => value.length === 2,
      message: 'GeoJSON coordinates must contain longitude and latitude.',
    },
  },
}, { _id: false });

/** Stored GeoJSON point → { lat, lng } for clients. */
export const latLng = (geo: any) => geo?.coordinates?.length === 2 ? { lat: geo.coordinates[1] as number, lng: geo.coordinates[0] as number } : undefined;

// Ordered photos; the first is the cover. `images`/`image`/`imageMediaIds` are kept in step for older readers.
export const photoSchema = new Schema({
  url: { type: String, required: true, trim: true },
  mediaId: { type: Schema.Types.ObjectId, ref: 'Media' },
  caption: { type: String, trim: true, maxlength: 200 },
}, { _id: false });

const listingSchema = new Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    immutable: true,
    default: () => `lst_${randomUUID()}`,
  },
  ownerId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
  type: {
    type: String,
    enum: ['hotel', 'car', 'tour', 'homestay', 'destination', 'offer'],
    required: true,
    index: true,
  },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, trim: true, lowercase: true },
  location: { type: String, required: true, trim: true, maxlength: 240 },
  coordinates: { type: coordinatesSchema, default: undefined },
  // Policies and practical facts guests check before booking (hotels and homestays). See STAY_INFO in vendor-listing.schemas.
  stayInfo: {
    childrenAllowed: Boolean,
    minCheckInAge: { type: Number, min: 0, max: 30 },
    // PKR per night; absent means no extra beds.
    extraBedPrice: { type: Number, min: 0 },
    petsAllowed: Boolean,
    smokingAllowed: Boolean,
    paymentMethods: { type: [{ type: String, enum: ['cash', 'card', 'jazzcash', 'easypaisa', 'bank_transfer'] }], default: undefined },
    powerBackup: { type: [{ type: String, enum: ['generator', 'solar', 'ups'] }], default: undefined },
    heating: { type: [{ type: String, enum: ['electric', 'gas', 'wood', 'central'] }], default: undefined },
    hotWater: { type: String, enum: ['always', 'scheduled', 'on_request', 'none'] },
    mobileNetworks: { type: [{ type: String, enum: ['scom', 'zong', 'jazz', 'telenor', 'ufone'] }], default: undefined },
    roadAccess: { type: String, enum: ['car', 'jeep', 'walk'] },
    roadNote: { type: String, trim: true, maxlength: 300 },
    // Months (1-12) the property normally receives guests.
    openMonths: { type: [Number], default: undefined },
  },
  price: { type: Number, required: true, min: 0 },
  priceMinor: { type: Number, min: 0 },
  currency: { type: String, enum: ['PKR'], default: 'PKR' },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewsCount: { type: Number, min: 0, default: 0 },
  // Averages of published reviews per category (1-5), kept in step by refreshListingRating.
  reviewScores: {
    staff: Number, cleanliness: Number, comfort: Number, value: Number, location: Number, wifi: Number,
  },
  image: { type: String, required: true, trim: true },
  images: { type: [String], default: [] },
  imageMediaIds: { type: [{ type: Schema.Types.ObjectId, ref: 'Media' }], default: [] },
  photos: { type: [photoSchema], default: undefined },
  description: { type: String, required: true, trim: true, maxlength: 10_000 },
  featured: { type: Boolean, default: false, index: true },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'published', 'rejected', 'paused', 'archived'],
    default: 'draft',
    index: true,
  },
  hotelSpecs: {
    roomsAvailable: { type: Number, min: 0 },
    amenities: { type: [String], default: undefined },
    facilities: { type: [String], default: undefined },
    policies: { type: [String], default: undefined },
    hotelType: String,
    checkInTime: String,
    checkOutTime: String,
  },
  homestaySpecs: {
    roomsAvailable: { type: Number, min: 0 },
    amenities: { type: [String], default: undefined },
    houseRules: { type: [String], default: undefined },
    hostName: String,
    hostImage: String,
    hostBio: { type: String, trim: true, maxlength: 1_000 },
    languages: { type: [String], default: undefined },
    familyOnSite: Boolean,
    experienceType: String,
    // 'rooms': guests book private rooms in the home; 'entire_home': one booking takes the whole place (a single room type of 1).
    stayType: { type: String, enum: ['rooms', 'entire_home'] },
    // Per guest per night, in PKR. Included meals cost nothing; the rest are chosen at booking and paid at check-in.
    meals: {
      type: [new Schema({
        type: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
        included: { type: Boolean, default: false },
        price: { type: Number, min: 0, default: 0 },
      }, { _id: false })],
      default: undefined,
    },
  },
  // Cars: what the car is and its rental terms (PKR). See carSpecsSchema in vendor-listing.schemas.
  carSpecs: {
    make: String,
    model: String,
    year: Number,
    category: String,
    transmission: { type: String, enum: ['Automatic', 'Manual'] },
    seats: { type: Number, min: 1 },
    luggage: { type: Number, min: 0 },
    fuelType: String,
    features: { type: [String], default: undefined },
    // Kept for older readers: true unless the car is self-drive only.
    withDriver: Boolean,
    driverMode: { type: String, enum: ['with_driver', 'self_drive', 'both'] },
    driverPerDay: { type: Number, min: 0 },
    fuelIncluded: Boolean,
    outsideCityPerDay: { type: Number, min: 0 },
    oneWay: { type: String, enum: ['not_offered', 'flat', 'on_request'] },
    oneWayFee: { type: Number, min: 0 },
    deposit: { type: Number, min: 0 },
    minDriverAge: { type: Number, min: 18 },
    pickupNote: { type: String, trim: true, maxlength: 500 },
  },
  // Tours: what the tour is. The adult price per person and seats per departure live on its single booking unit.
  tourSpecs: {
    durationDays: { type: Number, min: 1 },
    maxGroupSize: { type: Number, min: 1 },
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'] },
    category: String,
    // 'fixed': only the dates in `departures` can be booked; 'daily': any day the partner has not closed.
    schedule: { type: String, enum: ['fixed', 'daily'] },
    // PKR per child; absent means children pay the adult price.
    childPrice: { type: Number, min: 0 },
    minAge: { type: Number, min: 0 },
    meetingPoint: { type: String, trim: true, maxlength: 300 },
    startTime: String,
    languages: { type: [String], default: undefined },
    included: { type: [String], default: undefined },
    excluded: { type: [String], default: undefined },
    itinerary: { type: [itineraryItemSchema], default: undefined },
  },
  // Fixed-departure tours: bookable start dates (YYYY-MM-DD). Day-to-day operations, so edits apply at once without review.
  departures: { type: [String], default: undefined },
  offerSpecs: {
    category: String,
    discountLabel: String,
    promoCode: String,
    originalPrice: { type: Number, min: 0 },
    perks: { type: [String], default: undefined },
    expiresAt: Date,
  },
  deletedAt: { type: Date, default: null, index: true },
  rejectionReason: { type: String, trim: true, maxlength: 2_000 },
  // Edits to a live listing wait here ({ changes, submittedAt }) while the published version stays bookable.
  pendingRevision: { type: Schema.Types.Mixed, default: undefined },
  revisionRejectionReason: { type: String, trim: true, maxlength: 2_000 },
}, {
  timestamps: true,
  minimize: true,
});

listingSchema.index({ title: 'text', location: 'text', description: 'text' });
listingSchema.index({ type: 1, status: 1, featured: -1, createdAt: -1 });
listingSchema.index({ coordinates: '2dsphere' }, { sparse: true });

export const ListingModel: Model<any> = (mongoose.models.Listing as Model<any> | undefined)
  ?? mongoose.model<any>('Listing', listingSchema);
