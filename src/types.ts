export type ListingType = 'hotel' | 'car' | 'tour' | 'homestay' | 'destination' | 'offer';

export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviewsCount: number;
  image: string;
  images: string[];
  description: string;
  featured: boolean;
  // Specific fields
  hotelSpecs?: {
    roomsAvailable: number;
    amenities: string[];
    hotelType: string; // "Luxury Resort", "Boutique", etc.
  };
  homestaySpecs?: {
    roomsAvailable: number;
    amenities: string[];
    houseRules: string[];
    hostName: string;
    hostImage: string;
    experienceType: 'Mountain View' | 'Family Friendly' | 'Lakeside Stays' | 'Local Culture' | 'Budget Friendly';
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
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod: 'card' | 'jazzcash' | 'easypaisa' | 'pay_at_hotel';
  createdAt: string;
  // Additional details
  guests?: number;
  duration?: number; // nights or days
  withDriver?: boolean;
}

export interface Review {
  id: string;
  listingId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
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

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'payment' | 'refund' | 'payout';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

export const handleImageError = (e: any) => {
  e.target.onerror = null;
  e.target.src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80";
};
