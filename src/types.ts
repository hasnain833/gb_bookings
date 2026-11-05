import type { PropertyExtras } from './shared/utils/rooms';
export type ListingType = 'hotel' | 'car' | 'tour' | 'homestay' | 'destination' | 'offer';
export type MealType = 'breakfast' | 'lunch' | 'dinner';

/** Policies and practical facts for a hotel or homestay (Booking.com-style house rules plus mountain essentials). */
export interface StayInfo {
  childrenAllowed: boolean;
  minCheckInAge?: number;
  /** PKR per night; absent means no extra beds. */
  extraBedPrice?: number;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  paymentMethods: Array<'cash' | 'card' | 'jazzcash' | 'easypaisa' | 'bank_transfer'>;
  powerBackup: Array<'generator' | 'solar' | 'ups'>;
  heating: Array<'electric' | 'gas' | 'wood' | 'central'>;
  hotWater: 'always' | 'scheduled' | 'on_request' | 'none';
  mobileNetworks: Array<'scom' | 'zong' | 'jazz' | 'telenor' | 'ufone'>;
  roadAccess: 'car' | 'jeep' | 'walk';
  roadNote?: string;
  /** 1–12; all twelve means open all year. */
  openMonths: number[];
}

export interface Listing {
  cancellationPolicy?: string;
  fees?: Array<{ name: string; kind: 'percent' | 'amount'; value: number }>;
  id: string;
  type: ListingType;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviewsCount: number;
  /** Category averages of published reviews (1–5); present once the listing has reviews. */
  reviewScores?: Partial<Record<ReviewCategory, number>>;
  image: string;
  images: string[];
  /** Only present when at least one photo has a caption; same order as `images`. */
  photos?: { url: string; caption?: string }[];
  description: string;
  featured: boolean;
  /** Map pin set by the property. */
  coordinates?: { lat: number; lng: number };
  stayInfo?: StayInfo;
  /** Computed by the server from homestay meals or a hotel's "Breakfast" amenity. */
  breakfastIncluded?: boolean;
  // Specific fields
  hotelSpecs?: {
    roomsAvailable: number;
    amenities: string[];
    hotelType: string; // "Luxury Resort", "Boutique", etc.
    facilities?: string[];
    policies?: string[];
    checkInTime?: string;
    checkOutTime?: string;
    breakfast?: PropertyExtras["breakfast"];
    parking?: PropertyExtras["parking"];
    licenceNumber?: string;
    stars?: number;
  };
  homestaySpecs?: {
    roomsAvailable: number;
    amenities: string[];
    houseRules: string[];
    hostName: string;
    hostImage?: string;
    hostBio?: string;
    languages?: string[];
    familyOnSite?: boolean;
    experienceType: 'Mountain View' | 'Family Friendly' | 'Lakeside Stays' | 'Local Culture' | 'Budget Friendly';
    /** Missing on older homestays, which rent rooms. */
    stayType?: 'rooms' | 'entire_home';
    /** Price per guest per night in PKR; included meals cost nothing. */
    meals?: Array<{ type: MealType; included: boolean; price: number }>;
  };
  carSpecs?: CarSpecs;
  tourSpecs?: TourSpecs;
  /** Fixed-departure tours: upcoming start dates (YYYY-MM-DD). */
  departures?: string[];
  offerSpecs?: {
    category: string;
    discountLabel: string;
    promoCode?: string;
    originalPrice?: number;
    perks?: string[];
    expiresAt?: string;
  };
}

export type TourCategory = 'Trekking' | 'Sightseeing' | 'Jeep safari' | 'Cultural' | 'Adventure' | 'Day trip';

/** What a tour is (PKR). Tours listed before tour partners only have durationDays, maxGroupSize, difficulty, included and itinerary. */
export interface TourSpecs {
  durationDays: number;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  included: string[];
  itinerary: { day: number; title: string; desc: string }[];
  maxGroupSize?: number;
  category?: TourCategory;
  /** 'fixed': only the listing's departure dates; 'daily': any open day. */
  schedule?: 'fixed' | 'daily';
  /** Per child; absent means children pay the adult price. */
  childPrice?: number;
  minAge?: number;
  meetingPoint?: string;
  startTime?: string;
  languages?: string[];
  excluded?: string[];
}

/** What a tour booking resolved to at booking time (PKR). */
export interface BookingTour {
  days: number;
  meetingPoint?: string;
  startTime?: string;
  childPrice?: number;
}

export type CarCategory = 'Sedan' | 'Hatchback' | 'SUV' | '4x4 Jeep' | 'Van' | 'Coaster';
export type DriverMode = 'with_driver' | 'self_drive' | 'both';

/** A car and its rental terms (PKR). Cars listed before partner fleets only have the first five fields. */
export interface CarSpecs {
  category: string;
  transmission: 'Automatic' | 'Manual';
  seats: number;
  fuelType: string;
  withDriver: boolean;
  make?: string;
  model?: string;
  year?: number;
  luggage?: number;
  features?: string[];
  driverMode?: DriverMode;
  /** Added per day when renting with a driver. */
  driverPerDay?: number;
  fuelIncluded?: boolean;
  /** Added per day when the trip leaves the base city (the listing location). */
  outsideCityPerDay?: number;
  oneWay?: 'not_offered' | 'flat' | 'on_request';
  oneWayFee?: number;
  /** Self-drive: refundable deposit paid at pickup. */
  deposit?: number;
  minDriverAge?: number;
  pickupNote?: string;
  pickupPlaces?: string[];
  /** Absent: unlimited kilometres. */
  kmPerDay?: number;
  extraPerKm?: number;
  extras?: CarExtra[];
}

/** What a car booking resolved to: pickup details and the car's terms at booking time (PKR). */
export interface CarExtra { name: string; price: number; perDay: boolean }

export interface BookingRental {
  driverAge?: number;
  kmPerDay?: number;
  extraPerKm?: number;
  extras?: CarExtra[];
  pickupPlace?: string;
  pickupTime?: string;
  dropoffPlace?: string;
  licenceNumber?: string;
  driver: boolean;
  driverPerDay: number;
  outsideBaseCity: boolean;
  outsidePerDay: number;
  oneWay: boolean;
  oneWayOnRequest: boolean;
  oneWayFee: number;
  fuelIncluded: boolean;
  deposit: number;
}

export interface Booking {
  id: string;
  listingId: string;
  listingType: ListingType;
  listingTitle: string;
  listingImage: string;
  listingLocation: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'online' | 'card' | 'jazzcash' | 'easypaisa' | 'pay_at_hotel';
  /** GBBookings' commission on this booking (PKR) and the percent agreed at booking time. */
  platformFee?: number;
  platformFeePercent?: number;
  /** What the guest gets back after a paid booking was cancelled. */
  refund?: { percent: number; amount: number };
  /** Each sum owed back to the guest and how far it has got. */
  noShow?: { at: string; disputeUntil: string; dispute?: { status: 'open' | 'no_show_stands' | 'guest_stayed' | 'refund_guest'; note: string; at: string; decisionNote?: string } };
  refunds?: Array<{ kind: 'cancellation' | 'change' | 'late_payment' | 'duplicate_payment'; channel: 'safepay' | 'partner'; amount: number; status: 'pending' | 'sending' | 'sent' | 'failed'; sentAt?: string }>;
  /** Fees and taxes on top of the price, already included in `totalPrice`. */
  charges?: Array<{ name: string; type: 'fee' | 'tax'; amount: number }>;
  /** A paid booking changed to cost more: what the partner collects on arrival. */
  balanceDue?: number;
  balanceCollectedAt?: string;
  /** Absent on older bookings, which keep the refund tiers they were sold under. */
  cancellationPolicy?: string;
  lastChange?: { at: string; askedByGuest: boolean; reason?: string; from: { checkIn: string; checkOut: string; roomName?: string; rooms: number; total: number } };
  changeRequest?: { checkIn: string; checkOut: string; roomTypeId: string; roomName?: string; rooms: number; note?: string; status: 'pending' | 'declined'; declineReason?: string; requestedAt: string; proposedBy?: 'partner'; reason?: string; newTotalMinor?: number };
  createdAt: string;
  // Additional details
  guests?: number;
  duration?: number; // nights or days
  withDriver?: boolean;
  reference?: string;
  roomTypeId?: string;
  roomName?: string;
  rooms?: number;
  adults?: number;
  children?: number;
  nightlyRate?: number;
  /** Meals the guest chose, with the per-guest nightly price at booking time. */
  meals?: Array<{ type: MealType; price: number }>;
  mealsTotal?: number;
  /** Car rentals only; `endDate` is then the return date. */
  rental?: BookingRental;
  /** Tours only; `endDate` is then the last tour day. */
  tour?: BookingTour;
  /** Car rentals: driver, out-of-city and one-way charges. */
  extrasTotal?: number;
  /** Partner promo code used, e.g. "SUMMER10", its terms ("10% off") and the PKR taken off the total. */
  couponCode?: string;
  couponLabel?: string;
  discount?: number;
  specialRequests?: string;
  arrivalTime?: string;
  childAges?: number[];
  checkInTime?: string;
  checkOutTime?: string;
  /** Only once the property has confirmed the stay. */
  propertyPhone?: string;
  /** My Bookings only: the guest's review, or the last day they can still write one. */
  review?: Review;
  reviewableUntil?: string;
  /** Reservations screens only: what the property's team may do now (decided by the server). */
  vendorActions?: Array<'confirm' | 'cancel' | 'complete' | 'no_show' | 'mark_paid' | 'check_in' | 'change'>;
  paidAt?: string;
  /** Set once the hotel marks the guest as arrived. */
  checkedInAt?: string;
  /** Pending requests expire automatically after this time. */
  respondBy?: string;
  history?: Array<{ status: Booking['status']; at: string; reason?: string }>;
}

export type ReviewCategory = 'staff' | 'cleanliness' | 'comfort' | 'value' | 'location' | 'wifi';

/** A guest review (1–5 stars). Status, report and listingTitle only appear on partner/admin screens. */
export interface Review {
  id: string;
  authorName: string;
  stayMonth?: string;
  roomName?: string;
  overall: number;
  scores: Partial<Record<ReviewCategory, number>>;
  liked?: string;
  disliked?: string;
  reply?: { text: string; at: string };
  createdAt: string;
  status?: 'published' | 'hidden';
  hiddenReason?: string;
  report?: { reason: string; at: string };
  listingTitle?: string;
}

export const handleImageError = (e: any) => {
  e.target.onerror = null;
  e.target.src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80";
};
