import type {
  Booking,
  Listing,
  ListingType,
  Notification,
  SupportTicket,
  WalletTransaction,
} from '../../types';

export const AUTH_EXPIRED_EVENT = 'gb:auth-expired';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const canRefresh = allowRefresh
      && response.status === 401
      && !['/api/auth/login', '/api/auth/register', '/api/auth/refresh'].includes(path);
    if (canRefresh) {
      try {
        await request('/api/auth/refresh', { method: 'POST' }, false);
        return request<T>(path, init, false);
      } catch {
        // The session is gone; let the app shell drop its signed-in state.
        window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      }
    }

    const message = payload?.message
      ?? payload?.error?.message
      ?? (typeof payload?.error === 'string' ? payload.error : null)
      ?? `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

function unwrapCollection<T>(payload: T[] | { data: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.data;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  roles?: string[];
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorChannel?: 'email' | 'sms';
}

export interface AuthResponse {
  user: AuthUser;
}

export interface TwoFactorChallengeResponse {
  requiresTwoFactor: true;
  challengeId: string;
  expiresInSeconds: number;
}

export interface AuthSession {
  id: string;
  current: boolean;
  userAgent: string;
  ipAddress?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export interface VendorProfile {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  businessType: 'hotel' | 'homestay' | 'vehicle' | 'tour_operator' | 'multi_service';
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'suspended' | 'archived';
  registrationNumber?: string;
  taxNumber?: string;
  address?: Record<string, string>;
  rejectionReason?: string;
  verificationDocuments?: Array<{ type: string; status: string }>;
}

export interface MediaAsset {
  id: string;
  resourceType: 'image' | 'document';
  url?: string;
  mimeType: string;
  bytes: number;
  status: string;
}

export const EXPERIENCE_TYPES = ['Mountain View', 'Family Friendly', 'Lakeside Stays', 'Local Culture', 'Budget Friendly'] as const;

export interface VendorListing {
  id: string;
  type: 'hotel' | 'homestay';
  title: string;
  location: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  status: 'draft' | 'submitted' | 'published' | 'rejected' | 'paused' | 'archived';
  rejectionReason?: string;
}

export interface VendorRoom {
  id: string;
  name: string;
  description?: string;
  bedType: string;
  maxAdults: number;
  maxChildren: number;
  totalRooms: number;
  basePrice: number;
  amenities: string[];
  status: 'active' | 'paused' | 'archived';
}

export type VendorRoomInput = Omit<VendorRoom, 'id' | 'status'>;

/** Server-side listing filters; dates/guests only return listings with a free room that fits. */
export interface ListingFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  amenities?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  sort?: 'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  limit?: number;
}

export interface RoomAvailability {
  id: string;
  name: string;
  description?: string;
  bedType: string;
  maxAdults: number;
  maxChildren: number;
  amenities: string[];
  available: number;
  bookable: boolean;
  nightlyRate: number;
  totalPrice: number;
}

export interface ListingAvailability {
  listingId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  currency: 'PKR';
  rooms: RoomAvailability[];
}

export interface CreateBookingInput {
  listingId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  guest: { name: string; email: string; phone: string };
  specialRequests?: string;
}

export type VendorBookingAction = 'confirm' | 'cancel' | 'complete' | 'no_show';

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface AdminVendor extends Omit<VendorProfile, 'verificationDocuments'> {
  verificationNotes?: string;
  submittedAt?: string;
  createdAt: string;
  verificationDocuments: Array<{ type: string; status: string; mimeType?: string; url?: string }>;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  roles: string[];
  status: 'active' | 'suspended' | 'archived';
  emailVerified: boolean;
  createdAt: string;
}

export type UserStatusAction = 'activate' | 'suspend' | 'archive' | 'verify_email';

function queryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  return query.size ? `?${query}` : '';
}

export const api = {
  async getListings(params: { type?: ListingType | 'all'; search?: string } & ListingFilters = {}) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') query.set(key, String(value));
    }
    const suffix = query.size ? `?${query.toString()}` : '';
    const payload = await request<Listing[] | { data: Listing[] }>(`/api/listings${suffix}`);
    const listings = unwrapCollection(payload);

    // Keep clients correct even while an older API ignores its type parameter.
    return params.type && params.type !== 'all'
      ? listings.filter((listing) => listing.type === params.type)
      : listings;
  },

  getListing(id: string) {
    return request<Listing & { reviews?: unknown[] }>(`/api/listings/${encodeURIComponent(id)}`);
  },

  createListing(input: Omit<Listing, 'id' | 'rating' | 'reviewsCount' | 'featured'>) {
    return request<Listing>('/api/listings', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateListing(id: string, input: Partial<Listing>) {
    return request<Listing>(`/api/listings/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  getCurrentUser() {
    return request<AuthResponse>('/api/auth/me');
  },

  login(input: { email: string; password: string; rememberMe: boolean }) {
    return request<AuthResponse | TwoFactorChallengeResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  verifyLoginOtp(challengeId: string, code: string) {
    return request<AuthResponse>('/api/auth/login/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ challengeId, code }),
    });
  },

  getSessions() {
    return request<{ data: AuthSession[] }>('/api/auth/sessions').then((result) => result.data);
  },

  revokeSession(sessionId: string) {
    return request<void>(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
  },

  beginTwoFactorSetup(channel: 'email' | 'sms' = 'email') {
    return request<{ challengeId: string; expiresInSeconds: number }>('/api/auth/two-factor/setup', {
      method: 'POST', body: JSON.stringify({ channel }),
    });
  },

  enableTwoFactor(challengeId: string, code: string) {
    return request<AuthResponse>('/api/auth/two-factor/enable', {
      method: 'POST', body: JSON.stringify({ challengeId, code }),
    });
  },

  disableTwoFactor(password: string) {
    return request<void>('/api/auth/two-factor/disable', {
      method: 'POST', body: JSON.stringify({ password }),
    });
  },

  createVendorApplication(input: {
    name: string;
    email: string;
    phone: string;
    businessType: VendorProfile['businessType'];
    registrationNumber?: string;
    taxNumber?: string;
    address?: { line1: string; line2?: string; city: string; region: string; postalCode?: string; country?: string };
  }) {
    return request<{ data: VendorProfile }>('/api/vendors', { method: 'POST', body: JSON.stringify(input) });
  },

  getMyVendor() {
    return request<{ data: VendorProfile; membership: { role: string } }>('/api/vendors/me');
  },

  updateMyVendor(input: Partial<Omit<VendorProfile, 'id' | 'slug' | 'status'>>) {
    return request<{ data: VendorProfile }>('/api/vendors/me', { method: 'PATCH', body: JSON.stringify(input) });
  },

  attachVendorDocument(type: string, mediaId: string) {
    return request<{ data: VendorProfile }>('/api/vendors/me/documents', {
      method: 'POST', body: JSON.stringify({ type, mediaId }),
    });
  },

  submitVendorApplication() {
    return request<{ data: VendorProfile }>('/api/vendors/me/submit', { method: 'POST' });
  },

  uploadMedia(kind: 'images' | 'documents', file: File) {
    const body = new FormData();
    body.append('file', file);
    return request<{ data: MediaAsset }>(`/api/media/${kind}`, { method: 'POST', body });
  },

  getVendorListings() {
    return request<{ data: VendorListing[] }>('/api/v1/vendor/listings').then((result) => result.data);
  },

  createHotelListing(input: {
    type: VendorListing['type'];
    homestaySpecs?: { hostName: string; experienceType: typeof EXPERIENCE_TYPES[number] };
    title: string;
    location: string;
    description: string;
    price: number;
    imageIds: string[];
    hotelSpecs: { hotelType: string; amenities: string[]; facilities: string[]; policies: string[]; checkInTime: string; checkOutTime: string };
  }) {
    return request<{ data: VendorListing }>('/api/v1/vendor/listings', { method: 'POST', body: JSON.stringify(input) });
  },

  addHotelRoom(listingId: string, input: VendorRoomInput) {
    return request<{ data: VendorRoom }>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}/rooms`, {
      method: 'POST', body: JSON.stringify(input),
    });
  },

  getHotelRooms(listingId: string) {
    return request<{ data: VendorRoom[] }>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}/rooms`).then((result) => result.data);
  },

  updateHotelRoom(listingId: string, roomId: string, input: Partial<VendorRoomInput> & { status?: 'active' | 'paused' }) {
    return request<{ data: VendorRoom }>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}/rooms/${encodeURIComponent(roomId)}`, {
      method: 'PATCH', body: JSON.stringify(input),
    }).then((result) => result.data);
  },

  removeHotelRoom(listingId: string, roomId: string) {
    return request<void>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}/rooms/${encodeURIComponent(roomId)}`, { method: 'DELETE' });
  },

  submitHotelListing(listingId: string) {
    return request<{ data: VendorListing }>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}/submit`, { method: 'POST' });
  },

  register(input: { name: string; email: string; phone?: string; password: string }) {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  logout() {
    return request<void>('/api/auth/logout', { method: 'POST' });
  },

  forgotPassword(email: string) {
    return request<void>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  requestEmailVerification() {
    return request<{ alreadyVerified: boolean }>('/api/auth/email-verification/request', { method: 'POST' });
  },

  verifyEmail(token: string) {
    return request<void>('/api/auth/email-verification/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  resetPassword(token: string, newPassword: string) {
    return request<void>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  getBookings() {
    return request<Booking[] | { data: Booking[] }>('/api/v1/bookings').then(unwrapCollection);
  },

  getListingAvailability(listingId: string, params: { checkIn: string; checkOut: string; adults: number; children?: number; rooms?: number }) {
    const query = new URLSearchParams({
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      adults: String(params.adults),
      children: String(params.children ?? 0),
      rooms: String(params.rooms ?? 1),
    });
    return request<ListingAvailability>(`/api/v1/listings/${encodeURIComponent(listingId)}/availability?${query}`);
  },

  createBooking(input: CreateBookingInput, idempotencyKey: string) {
    return request<{ data: Booking }>('/api/v1/bookings', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ ...input, paymentMethod: 'pay_at_hotel' }),
    }).then((result) => result.data);
  },

  cancelBooking(bookingId: string, reason: string) {
    return request<{ data: Booking }>(`/api/v1/bookings/${encodeURIComponent(bookingId)}/cancel`, {
      method: 'POST', body: JSON.stringify({ reason }),
    }).then((result) => result.data);
  },

  getVendorBookings(status?: Booking['status']) {
    const suffix = status ? `?status=${status}` : '';
    return request<{ data: Booking[] }>(`/api/v1/vendor/bookings${suffix}`).then((result) => result.data);
  },

  actOnVendorBooking(bookingId: string, action: VendorBookingAction, reason?: string) {
    return request<{ data: Booking }>(`/api/v1/vendor/bookings/${encodeURIComponent(bookingId)}/actions`, {
      method: 'POST', body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
    }).then((result) => result.data);
  },

  admin: {
    listVendors(params: { status?: string; page?: number } = {}) {
      return request<Paginated<AdminVendor>>(`/api/v1/admin/vendors${queryString(params)}`);
    },
    decideVendor(vendorId: string, decision: 'approved' | 'rejected' | 'suspended', notes: string) {
      return request<{ data: AdminVendor }>(`/api/v1/admin/vendors/${encodeURIComponent(vendorId)}/decision`, {
        method: 'POST', body: JSON.stringify({ decision, notes }),
      });
    },
    listPendingListings() {
      return request<{ data: VendorListing[] }>('/api/v1/admin/listings').then((result) => result.data);
    },
    moderateListing(listingId: string, decision: 'published' | 'rejected', notes: string) {
      return request<{ data: VendorListing }>(`/api/v1/admin/listings/${encodeURIComponent(listingId)}/decision`, {
        method: 'POST', body: JSON.stringify({ decision, notes }),
      });
    },
    listUsers(params: { status?: string; role?: string; search?: string; page?: number } = {}) {
      return request<Paginated<AdminUser>>(`/api/v1/admin/users${queryString(params)}`);
    },
    changeUserStatus(userId: string, action: UserStatusAction, reason: string) {
      return request<{ data: AdminUser }>(`/api/v1/admin/users/${encodeURIComponent(userId)}/status`, {
        method: 'POST', body: JSON.stringify({ action, reason }),
      }).then((result) => result.data);
    },
    listBookings(params: { status?: string; from?: string; to?: string; page?: number } = {}) {
      return request<Paginated<Booking>>(`/api/v1/admin/bookings${queryString(params)}`);
    },
    actOnBooking(bookingId: string, action: VendorBookingAction, reason?: string) {
      return request<{ data: Booking }>(`/api/v1/admin/bookings/${encodeURIComponent(bookingId)}/actions`, {
        method: 'POST', body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
      }).then((result) => result.data);
    },
  },

  getNotifications() {
    return request<Notification[] | { data: Notification[] }>('/api/notifications').then(unwrapCollection);
  },

  getWalletTransactions() {
    return request<WalletTransaction[] | { data: WalletTransaction[] }>('/api/wallet/transactions').then(unwrapCollection);
  },

  getWishlist() {
    return request<Listing[] | { data: Listing[] }>('/api/wishlist').then(unwrapCollection);
  },

  removeWishlistItem(listingId: string) {
    return request<void>(`/api/wishlist/${encodeURIComponent(listingId)}`, { method: 'DELETE' });
  },

  addWishlistItem(listingId: string) {
    return request<void>('/api/wishlist', {
      method: 'POST',
      body: JSON.stringify({ listingId }),
    });
  },

  validateCoupon(input: { code: string; listingId: string; subtotal: number }) {
    return request<{ code: string; discountAmount: number; message?: string }>('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getSupportTickets() {
    return request<SupportTicket[] | { data: SupportTicket[] }>('/api/support/tickets').then(unwrapCollection);
  },
};
