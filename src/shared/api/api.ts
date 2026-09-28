import type {
  Booking,
  Listing,
  ListingType,
  Notification,
  SupportTicket,
  WalletTransaction,
} from '../../types';

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
        // Return the original request error so callers receive the relevant context.
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

export interface VendorListing {
  id: string;
  type: 'hotel';
  title: string;
  location: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  status: 'draft' | 'submitted' | 'published' | 'rejected' | 'paused' | 'archived';
  rejectionReason?: string;
}

export const api = {
  async getListings(params: { type?: ListingType | 'all'; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.search) query.set('search', params.search);
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
    title: string;
    location: string;
    description: string;
    price: number;
    imageIds: string[];
    hotelSpecs: { hotelType: string; amenities: string[]; facilities: string[]; policies: string[]; checkInTime: string; checkOutTime: string };
  }) {
    return request<{ data: VendorListing }>('/api/v1/vendor/listings', { method: 'POST', body: JSON.stringify(input) });
  },

  addHotelRoom(listingId: string, input: {
    name: string; description?: string; bedType: string; maxAdults: number; maxChildren: number;
    totalRooms: number; basePrice: number; amenities: string[];
  }) {
    return request<{ data: { id: string } }>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}/rooms`, {
      method: 'POST', body: JSON.stringify(input),
    });
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
    return request<Booking[] | { data: Booking[] }>('/api/bookings').then(unwrapCollection);
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
