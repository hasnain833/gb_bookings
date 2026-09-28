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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    const message = payload?.message ?? payload?.error ?? `Request failed (${response.status})`;
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
}

interface AuthResponse {
  user: AuthUser;
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
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
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
