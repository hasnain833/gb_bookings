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
  carSpecs?: {
    category: string; // "SUV", "Sedan", "4x4"
    transmission: 'Automatic' | 'Manual';
    seats: number;
    fuelType: string;
    withDriver: boolean;
  };
  tourSpecs?: {
    durationDays: number;
    maxGroupSize: number;
    difficulty: 'Easy' | 'Moderate' | 'Challenging';
    included: string[];
    itinerary: { day: number; title: string; desc: string }[];
  };
  offerSpecs?: {
    category: string;
    discountLabel: string;
    promoCode?: string;
    originalPrice?: number;
    perks?: string[];
    expiresAt?: string;
  };
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
  paymentMethod: 'card' | 'jazzcash' | 'easypaisa' | 'pay_at_hotel';
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
  specialRequests?: string;
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

export interface SupportTicket {
  id: string;
  subject: string;
  category: 'booking' | 'payment' | 'vendor' | 'other';
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
  replies?: { id: string; sender: 'user' | 'support'; message: string; createdAt: string }[];
}

export const handleImageError = (e: any) => {
  e.target.onerror = null;
  e.target.src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80";
};
