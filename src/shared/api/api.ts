import type {
  Booking,
  Listing,
  BookingRental,
  CarSpecs,
  TourSpecs,
  ListingType,
  MealType,
  Review,
  ReviewCategory,
  StayInfo,
} from '../../types';

export const AUTH_EXPIRED_EVENT = 'gb:auth-expired';
export const AUTH_CHANGED_EVENT = 'gb:auth-changed';
let authGeneration = 0;
let hasKnownSession = false;
const activeRequests = new Set<AbortController>();

export function resetApiSession() {
  hasKnownSession = false;
  authGeneration += 1;
  for (const controller of activeRequests) controller.abort();
  activeRequests.clear();
  refreshInFlight = null;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function hasApiSession() { return hasKnownSession; }
export function markApiSession() {
  hasKnownSession = true;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let refreshInFlight: Promise<unknown> | null = null;

async function request<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  const generation = authGeneration;
  const controller = new AbortController();
  activeRequests.add(controller);
  try {
    const headers = new Headers(init.headers);
    if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(path, {
      ...init,
      headers,
      credentials: 'include',
      signal: controller.signal,
    }).catch(() => { throw new ApiError(controller.signal.aborted ? 'Your account session changed. Please try again.' : 'We couldn’t connect. Please check your connection and try again.', controller.signal.aborted ? 401 : 0); });
    if (generation !== authGeneration) throw new ApiError('Your account session changed. Please try again.', 401);

    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json')
      ? await response.json()
      : null;
    if (generation !== authGeneration) throw new ApiError('Your account session changed. Please try again.', 401);

    if (!response.ok) {
      const canRefresh = allowRefresh
        && response.status === 401
        && (hasKnownSession || path.endsWith('/auth/me'))
        && !/\/auth\/(login(?:\/verify-otp)?|register(?:\/verify-otp)?|refresh|forgot-password|reset-password)$/.test(path);
      if (canRefresh) {
        try {
          if (!refreshInFlight) {
            const pending = request('/api/v1/auth/refresh', { method: 'POST' }, false)
              .finally(() => { if (refreshInFlight === pending) refreshInFlight = null; });
            refreshInFlight = pending;
          }
          await refreshInFlight;
          if (generation !== authGeneration) throw new ApiError('Your account session changed. Please try again.', 401);
        } catch {
          // The session is gone; let the app shell drop its signed-in state.
          if (generation === authGeneration && hasKnownSession) window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
          throw new ApiError('Your session has expired. Please sign in again.', 401);
        }
        return request<T>(path, init, false);
      }

      const suppliedMessage = payload?.message
        ?? payload?.error?.message
        ?? (typeof payload?.error === 'string' ? payload.error : null)
        ?? 'We couldn’t complete this request. Please try again.';
      const message = response.status === 503 ? 'This service is temporarily unavailable. Please try again shortly.'
        : response.status >= 500 ? 'Something went wrong on our side. Please try again in a moment.'
          : payload?.error?.code === 'VALIDATION_ERROR' ? Object.values(payload.error.details?.fieldErrors ?? {}).flat().join(' ') || 'Please check the information you entered.' : suppliedMessage;
      throw new ApiError(message, response.status);
    }

    return payload as T;
  } finally { activeRequests.delete(controller); }
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
  phone?: string;
  memberSince?: string;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface TwoFactorChallengeResponse {
  requiresTwoFactor: true;
  challengeId: string;
  expiresInSeconds: number;
}

export interface SignupChallengeResponse {
  requiresEmailVerification: true;
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
  cnicNumber?: string;
  address?: Record<string, string>;
  rejectionReason?: string;
  submittedAt?: string;
  verificationDocuments?: Array<{ type: string; status: string }>;
  /** Business-detail changes awaiting admin approval (approved vendors only). */
  pendingChanges?: VendorChangeRequest & { requestedAt: string };
  changeRejectionReason?: string;
}

export interface VendorChangeRequest {
  name: string; email: string; phone: string; registrationNumber?: string; taxNumber?: string;
  address: { line1: string; city: string; region: string };
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
export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];
export const mealLabel = (type: MealType) => type.charAt(0).toUpperCase() + type.slice(1);

/** Price is per guest per night in PKR; included meals cost nothing. */
export interface MealOption { type: MealType; included: boolean; price: number }
export interface LatLng { lat: number; lng: number }
export interface HomestaySpecs {
  hostName: string;
  experienceType: typeof EXPERIENCE_TYPES[number];
  stayType: 'rooms' | 'entire_home';
  hostBio?: string;
  hostImage?: string;
  languages: string[];
  familyOnSite: boolean;
  meals: MealOption[];
}
/** What the host saves: the host photo travels as an upload or the existing url. */
export type HomestaySpecsInput = Omit<HomestaySpecs, 'hostImage'> & { hostPhoto?: PhotoInput };

export interface ListingPhoto { url: string; caption?: string }
/** Photo sent when saving: an existing photo by url, or a fresh upload by mediaId. First is the cover. */
export interface PhotoInput { url?: string; mediaId?: string; caption?: string }

type ListingContent = Pick<VendorListing, 'title' | 'location' | 'description' | 'hotelSpecs' | 'homestaySpecs' | 'carSpecs'> & { photos: ListingPhoto[]; coordinates?: { type: 'Point'; coordinates: [number, number] } };
type RoomContent = Pick<VendorRoom, 'name' | 'description' | 'bedType' | 'maxAdults' | 'maxChildren' | 'amenities' | 'photos'>;

export interface VendorListing {
  id: string;
  type: 'hotel' | 'homestay' | 'car' | 'tour';
  title: string;
  location: string;
  description: string;
  price: number;
  image: string;
  images: string[];
  photos: ListingPhoto[];
  status: 'draft' | 'submitted' | 'published' | 'rejected' | 'paused' | 'archived';
  rejectionReason?: string;
  /** Edits to a live listing waiting for admin review; guests still see the published version. */
  pendingRevision?: { changes: Partial<ListingContent>; submittedAt: string };
  revisionRejectionReason?: string;
  /** Present in admin listings. */
  vendorName?: string;
  updatedAt?: string;
  hotelSpecs?: { hotelType: string; amenities: string[]; facilities: string[]; policies: string[]; checkInTime: string; checkOutTime: string };
  homestaySpecs?: HomestaySpecs;
  carSpecs?: CarSpecs;
  tourSpecs?: TourSpecs;
  /** Fixed-departure tours: bookable start dates. */
  departures?: string[];
  coordinates?: LatLng;
  /** Cars and tours only set paymentMethods. */
  stayInfo?: StayInfo;
}

/** Cars only say how guests can pay at pickup. */
export type ListingStayInfoInput = StayInfo | Pick<StayInfo, 'paymentMethods'>;
export type TourSpecsInput = Required<Pick<TourSpecs, 'durationDays' | 'category' | 'difficulty' | 'schedule' | 'meetingPoint' | 'languages' | 'included' | 'excluded' | 'itinerary'>> & Pick<TourSpecs, 'childPrice' | 'minAge' | 'startTime'>;
export type CarSpecsInput = Omit<CarSpecs, 'withDriver' | 'make' | 'model' | 'year' | 'driverMode' | 'fuelIncluded' | 'oneWay' | 'features'>
  & Required<Pick<CarSpecs, 'make' | 'model' | 'year' | 'driverMode' | 'fuelIncluded' | 'oneWay' | 'features'>>;

export interface VendorRoom {
  id: string;
  name: string;
  description?: string;
  bedType: string;
  maxAdults: number;
  maxChildren: number;
  totalRooms: number;
  basePrice: number;
  /** Friday and Saturday nights; null clears it. */
  weekendPrice?: number | null;
  /** Date ranges (YYYY-MM-DD, inclusive) with their own price; a season beats the weekend price. */
  seasons?: RoomSeason[];
  amenities: string[];
  photos: ListingPhoto[];
  status: 'active' | 'paused' | 'archived';
  /** On a live hotel: guest-facing edits (or a whole new room) waiting for review. */
  pendingRevision?: { changes: Partial<RoomContent>; isNew: boolean };
}

/** Admin-set money rules: GBBookings' commission, and refunds when a guest cancels a paid booking within N hours of booking. */
export interface PlatformSettings {
  commissionPercent: number;
  refundTiers: Array<{ withinHours: number; refundPercent: number }>;
  laterRefundPercent: number;
}

/** A guest↔partner thread about one listing. `side` is which side the viewer is on. */
export interface Conversation {
  id: string;
  side: 'guest' | 'partner';
  listing: { publicId: string; title: string; image?: string; type?: string };
  partnerName?: string;
  guestName?: string;
  lastMessage?: { body: string; sender: 'guest' | 'partner'; at: string };
  unread: number;
  updatedAt: string;
}
export interface ChatMessage { id: string; sender: 'guest' | 'partner'; body: string; contactsHidden: boolean; at: string; mine: boolean }
export interface ConversationThread {
  conversation: Conversation;
  messages: ChatMessage[];
  bookings: Array<{ reference: string; checkIn: string; checkOut: string; status: string }>;
}
export interface SentMessage { conversation: Conversation; message: ChatMessage }

export interface RoomSeason { name: string; from: string; to: string; price: number }

export type VendorRoomInput =Omit<VendorRoom, 'id' | 'status' | 'photos' | 'pendingRevision'> & { photos?: PhotoInput[] };

export interface RoomCalendar {
  roomId: string;
  totalRooms: number;
  days: Array<{ date: string; booked: number; closed: number; available: number }>;
}

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
  experience?: string;
  stayType?: 'rooms' | 'entire_home';
  breakfast?: 'true';
  category?: string;
  transmission?: 'Automatic' | 'Manual';
  /** Cars: cars offering a driver, or self-drive. */
  driver?: 'with_driver' | 'self_drive';
  sort?: 'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
  limit?: number;
  page?: number;
}

export interface RoomAvailability {
  id: string;
  name: string;
  description?: string;
  bedType: string;
  maxAdults: number;
  maxChildren: number;
  amenities: string[];
  photos: ListingPhoto[];
  available: number;
  bookable: boolean;
  nightlyRate: number;
  roomTotal: number;
  /** Car rentals: driver, out-of-city and one-way charges. */
  extrasTotal?: number;
  /** PKR taken off by the promo code, when one was quoted. */
  discount?: number;
  /** Room total plus the chosen meals, less any promo code discount. */
  totalPrice: number;
}

/** A partner's promo code; `value` is a percent or PKR depending on `kind`. */
export interface PartnerCoupon {
  id: string; code: string; kind: 'percent' | 'amount'; value: number;
  validUntil?: string; maxUses?: number; uses: number; active: boolean; createdAt: string;
}

export interface ListingAvailability {
  listingId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  currency: 'PKR';
  /** Last day the guest can cancel for free; absent when the stay starts today. */
  freeCancellationUntil?: string;
  /** Whether checkout can offer Pay now (online payment is set up). */
  onlinePayment?: boolean;
  mealsTotal: number;
  /** The promo code applied to the quote. */
  coupon?: { code: string; label: string };
  /** Car rentals: what the driver, out-of-city and one-way choices resolved to. */
  rental?: BookingRental;
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
  /** Paid homestay meals; included ones are not sent. */
  meals?: MealType[];
  couponCode?: string;
  /** Car rentals; then checkOut is the return date, adults are passengers and rooms are cars. */
  rental?: { driver: boolean; pickupPlace: string; pickupTime: string; dropoffPlace?: string; outsideBaseCity: boolean; oneWay: boolean; licenceNumber?: string };
  /** Pay now (online) or Pay on arrival. */
  paymentMethod: 'online' | 'pay_at_hotel';
  expectedTotalMinor?: number;
}

export type VendorBookingAction = 'confirm' | 'cancel' | 'complete' | 'no_show' | 'mark_paid' | 'check_in';

/** Reservation list filters; `from`/`to` bound the check-in date, `q` matches reference, guest name, email or phone. */
export type BookingListParams = { status?: Booking['status']; stay?: 'arriving' | 'in_house'; from?: string; to?: string; q?: string; listingId?: string; page?: number };

export interface VendorReport {
  from: string;
  to: string;
  currency: 'PKR';
  hotels: Array<{
    listingId: string; title: string; roomNightsAvailable: number; roomNightsSold: number; occupancy: number;
    bookedRevenue: number; collected: number; arrivals: number; cancelled: number; noShows: number;
  }>;
}

export interface TeamMember { id: string; role: 'owner' | 'manager' | 'listings' | 'reservations' | 'finance'; status: string; name?: string; email?: string; createdAt: string }

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface AdminVendor extends Omit<VendorProfile, 'verificationDocuments'> {
  verificationNotes?: string;
  submittedAt?: string;
  createdAt: string;
  verificationDocuments: Array<{ type: string; status: string; mimeType?: string; url?: string }>;
  identityCheck?: IdentityCheck;
}

/** Automatic CNIC pre-check run when a partner submits; the admin still decides. */
export interface IdentityCheck {
  status: 'passed' | 'flagged';
  findings: Array<{ level: 'ok' | 'warn' | 'fail'; text: string }>;
  read?: { name?: string; cnicNumber?: string; expiryDate?: string };
  checkedAt: string;
}

export type AdminBookingLookup = Booking & { vendor?: { name: string; email: string; phone?: string } };

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
  /** Most-listed towns with a cover image (published listings only). */
  getTopPlaces(type: ListingType | 'all', limit = 5) {
    return request<{ data: Array<{ name: string; count: number; image: string }> }>(`/api/v1/listings/places${queryString({ type, limit })}`).then((result) => result.data);
  },
  /** Listings whose location mentions each place, counted over the whole catalog. */
  getPlaceCounts(type: ListingType | 'all', places: string[]) {
    const query = new URLSearchParams([['type', type], ...places.map((place) => ['place', place])]);
    return request<{ data: Record<string, number> }>(`/api/v1/listings/place-counts?${query}`).then((result) => result.data);
  },

  getListingsPage(params: { type?: ListingType | 'all'; search?: string } & ListingFilters = {}) {
    return request<{ data: Listing[]; meta: Paginated<Listing>['pagination'] }>(`/api/v1/listings${queryString({ ...params })}`);
  },

  getListing(id: string) {
    return request<{ data: Listing }>(`/api/v1/listings/${encodeURIComponent(id)}`).then((result) => result.data);
  },

  getCurrentUser() {
    return request<AuthResponse>('/api/v1/auth/me');
  },

  login(input: { email: string; password: string; rememberMe: boolean }) {
    return request<AuthResponse | TwoFactorChallengeResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  verifyLoginOtp(challengeId: string, code: string) {
    return request<AuthResponse>('/api/v1/auth/login/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ challengeId, code }),
    });
  },

  getSessions() {
    return request<{ data: AuthSession[] }>('/api/v1/auth/sessions').then((result) => result.data);
  },

  revokeSession(sessionId: string) {
    return request<void>(`/api/v1/auth/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
  },

  beginTwoFactorSetup(channel: 'email' | 'sms' = 'email') {
    return request<{ challengeId: string; expiresInSeconds: number }>('/api/v1/auth/two-factor/setup', {
      method: 'POST', body: JSON.stringify({ channel }),
    });
  },

  enableTwoFactor(challengeId: string, code: string) {
    return request<AuthResponse>('/api/v1/auth/two-factor/enable', {
      method: 'POST', body: JSON.stringify({ challengeId, code }),
    });
  },

  disableTwoFactor(password: string) {
    return request<void>('/api/v1/auth/two-factor/disable', {
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
    cnicNumber?: string;
    address?: { line1: string; line2?: string; city: string; region: string; postalCode?: string; country?: string };
  }) {
    return request<{ data: VendorProfile }>('/api/v1/vendors', { method: 'POST', body: JSON.stringify(input) });
  },

  getMyVendor() {
    return request<{ data: VendorProfile; membership: { role: string; access: Array<'listings' | 'reservations' | 'reports' | 'team' | 'business'> } }>('/api/v1/vendors/me');
  },

  updateMyVendor(input: Partial<Omit<VendorProfile, 'id' | 'slug' | 'status'>>) {
    return request<{ data: VendorProfile }>('/api/v1/vendors/me', { method: 'PATCH', body: JSON.stringify(input) });
  },

  attachVendorDocument(type: string, mediaId: string) {
    return request<{ data: VendorProfile }>('/api/v1/vendors/me/documents', {
      method: 'POST', body: JSON.stringify({ type, mediaId }),
    });
  },

  requestVendorChanges(input: VendorChangeRequest) {
    return request<{ data: VendorProfile }>('/api/v1/vendors/me/change-request', { method: 'POST', body: JSON.stringify(input) }).then((result) => result.data);
  },

  submitVendorApplication() {
    return request<{ data: VendorProfile }>('/api/v1/vendors/me/submit', { method: 'POST' });
  },

  uploadMedia(kind: 'images' | 'documents', file: File) {
    const body = new FormData();
    body.append('file', file);
    return request<{ data: MediaAsset }>(`/api/v1/media/${kind}`, { method: 'POST', body });
  },

  getVendorListings() {
    return request<{ data: VendorListing[] }>('/api/v1/vendor/listings').then((result) => result.data);
  },

  /** Re-reads one own listing, e.g. to pick up its review flag after a room edit. */
  getHotelListing(listingId: string) {
    return api.getVendorListings().then((listings) => {
      const listing = listings.find((item) => item.id === listingId);
      if (!listing) throw new Error('Property not found.');
      return listing;
    });
  },

  createHotelListing(input: {
    type: VendorListing['type'];
    homestaySpecs?: HomestaySpecsInput;
    coordinates?: LatLng;
    stayInfo?: ListingStayInfoInput;
    carSpecs?: CarSpecsInput;
    tourSpecs?: TourSpecsInput;
    departures?: string[];
    title: string;
    location: string;
    description: string;
    price: number;
    imageIds: string[];
    /** Same photos as imageIds, with order and captions. */
    photos?: PhotoInput[];
    hotelSpecs?: { hotelType: string; amenities: string[]; facilities: string[]; policies: string[]; checkInTime: string; checkOutTime: string };
  }) {
    return request<{ data: VendorListing }>('/api/v1/vendor/listings', { method: 'POST', body: JSON.stringify(input) });
  },

  updateHotelListing(listingId: string, input: Partial<Pick<VendorListing, 'title' | 'location' | 'description' | 'hotelSpecs'>> & { homestaySpecs?: Omit<HomestaySpecsInput, 'stayType'>; carSpecs?: CarSpecsInput; tourSpecs?: TourSpecsInput; departures?: string[]; coordinates?: LatLng; stayInfo?: ListingStayInfoInput; imageIds?: string[]; photos?: PhotoInput[] }) {
    return request<{ data: VendorListing }>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}`, {
      method: 'PATCH', body: JSON.stringify(input),
    }).then((result) => result.data);
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

  getRoomCalendar(listingId: string, roomId: string, from: string, to: string) {
    return request<{ data: RoomCalendar }>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}/rooms/${encodeURIComponent(roomId)}/calendar${queryString({ from, to })}`).then((result) => result.data);
  },

  setRoomClosures(listingId: string, roomId: string, input: { from: string; to: string; closed: number }) {
    return request<{ data: RoomCalendar }>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}/rooms/${encodeURIComponent(roomId)}/calendar`, {
      method: 'PUT', body: JSON.stringify(input),
    }).then((result) => result.data);
  },

  removeHotelRoom(listingId: string, roomId: string) {
    return request<void>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}/rooms/${encodeURIComponent(roomId)}`, { method: 'DELETE' });
  },

  submitHotelListing(listingId: string) {
    return request<{ data: VendorListing }>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}/submit`, { method: 'POST' });
  },

  setListingStatus(listingId: string, status: 'paused' | 'published') {
    return request<{ data: VendorListing }>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}/status`, {
      method: 'POST', body: JSON.stringify({ status }),
    }).then((result) => result.data);
  },

  duplicateListing(listingId: string) {
    return request<{ data: VendorListing }>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}/duplicate`, { method: 'POST' }).then((result) => result.data);
  },

  archiveListing(listingId: string) {
    return request<void>(`/api/v1/vendor/listings/${encodeURIComponent(listingId)}`, { method: 'DELETE' });
  },

  register(input: { name: string; email: string; phone?: string; password: string; confirmPassword: string; acceptTerms: true }) {
    return request<SignupChallengeResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  verifySignupOtp(challengeId: string, code: string) {
    return request<AuthResponse>('/api/v1/auth/register/verify-otp', { method: 'POST', body: JSON.stringify({ challengeId, code }) });
  },

  logout() {
    return request<void>('/api/v1/auth/logout', { method: 'POST' });
  },

  changePassword(currentPassword: string, newPassword: string) {
    return request<void>('/api/v1/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
  },

  forgotPassword(email: string) {
    return request<void>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  requestEmailVerification() {
    return request<{ alreadyVerified: boolean }>('/api/v1/auth/email-verification/request', { method: 'POST' });
  },

  verifyEmail(token: string) {
    return request<void>('/api/v1/auth/email-verification/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  resetPassword(token: string, newPassword: string) {
    return request<void>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  listConversations(side: 'guest' | 'partner') {
    return request<{ data: Conversation[] }>(`/api/v1/messages/conversations${queryString({ side })}`).then((result) => result.data);
  },
  getConversation(id: string) {
    return request<{ data: ConversationThread }>(`/api/v1/messages/conversations/${encodeURIComponent(id)}`).then((result) => result.data);
  },
  /** A guest's first message to a listing's partner (reuses their thread for that listing). */
  startConversation(listingId: string, body: string) {
    return request<{ data: SentMessage }>('/api/v1/messages/conversations', { method: 'POST', body: JSON.stringify({ listingId, body }) }).then((result) => result.data);
  },
  sendMessage(conversationId: string, body: string) {
    return request<{ data: SentMessage }>(`/api/v1/messages/conversations/${encodeURIComponent(conversationId)}/messages`, { method: 'POST', body: JSON.stringify({ body }) }).then((result) => result.data);
  },
  unreadMessages() {
    return request<{ data: { guest: number; partner: number; isPartner: boolean } }>('/api/v1/messages/unread').then((result) => result.data);
  },

  /** The guest's bookings; `trip` picks the Upcoming, Past or Cancelled tab. */
  getBookingsPage(page = 1, trip?: 'upcoming' | 'past' | 'cancelled') {
    return request<Paginated<Booking>>(`/api/v1/bookings${queryString({ page, trip })}`);
  },

  updateProfile(input: { name?: string; phone?: string }) {
    return request<AuthResponse>('/api/v1/auth/me', { method: 'PATCH', body: JSON.stringify(input) }).then((result) => result.user);
  },

  getListingAvailability(listingId: string, params: { checkIn: string; checkOut: string; adults: number; children?: number; rooms?: number; meals?: MealType[]; coupon?: string; driver?: boolean; outsideBaseCity?: boolean; oneWay?: boolean }) {
    const query = new URLSearchParams({
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      adults: String(params.adults),
      children: String(params.children ?? 0),
      rooms: String(params.rooms ?? 1),
      ...(params.meals?.length ? { meals: params.meals.join(',') } : {}),
      ...(params.coupon ? { coupon: params.coupon } : {}),
      ...(params.driver !== undefined ? { driver: String(params.driver) } : {}),
      ...(params.outsideBaseCity ? { outsideBaseCity: 'true' } : {}),
      ...(params.oneWay ? { oneWay: 'true' } : {}),
    });
    return request<ListingAvailability>(`/api/v1/listings/${encodeURIComponent(listingId)}/availability?${query}`);
  },

  createBooking(input: CreateBookingInput, idempotencyKey: string) {
    return request<{ data: Booking }>('/api/v1/bookings', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    }).then((result) => result.data);
  },

  /** GBBookings' current commission percent (public, for the Become a partner page). */
  getCommission() {
    return request<{ data: { commissionPercent: number } }>('/api/v1/settings/commission').then((result) => result.data.commissionPercent);
  },

  /** The admin-set refund rules for guests cancelling a paid booking (public). */
  getRefundRules() {
    return request<{ data: Omit<PlatformSettings, 'commissionPercent'> }>('/api/v1/settings/refunds').then((result) => result.data);
  },

  /** Opens Safepay's payment page for an unpaid Pay now booking; returns where to send the guest. */
  startPayment(bookingId: string) {
    return request<{ data: { url: string } }>(`/api/v1/bookings/${encodeURIComponent(bookingId)}/pay`, { method: 'POST' }).then((result) => result.data.url);
  },

  /** After returning from Safepay: the server checks the payment with Safepay and returns the booking. */
  verifyPayment(bookingId: string) {
    return request<{ data: Booking }>(`/api/v1/bookings/${encodeURIComponent(bookingId)}/payment/verify`, { method: 'POST' }).then((result) => result.data);
  },

  cancelBooking(bookingId: string, reason: string) {
    return request<{ data: Booking }>(`/api/v1/bookings/${encodeURIComponent(bookingId)}/cancel`, {
      method: 'POST', body: JSON.stringify({ reason }),
    }).then((result) => result.data);
  },

  getVendorBookings(params: BookingListParams = {}) {
    return request<Paginated<Booking>>(`/api/v1/vendor/bookings${queryString(params)}`);
  },

  /** New dates, room category or room count; the server re-quotes the price at today's rate. */
  changeVendorBooking(bookingId: string, input: { checkIn: string; checkOut: string; roomTypeId: string; rooms: number }) {
    return request<{ data: Booking }>(`/api/v1/vendor/bookings/${encodeURIComponent(bookingId)}/change`, {
      method: 'POST', body: JSON.stringify(input),
    }).then((result) => result.data);
  },

  getVendorReport(from: string, to: string) {
    return request<{ data: VendorReport }>(`/api/v1/vendor/bookings/report${queryString({ from, to })}`).then((result) => result.data);
  },

  subscribeNewsletter(email: string, source: 'footer' | 'homestays') {
    return request<void>('/api/v1/newsletter', { method: 'POST', body: JSON.stringify({ email, source }) });
  },

  getListingReviews(listingId: string, page = 1) {
    return request<Paginated<Review>>(`/api/v1/listings/${encodeURIComponent(listingId)}/reviews${queryString({ page })}`);
  },
  createReview(bookingId: string, input: { overall: number; scores: Partial<Record<ReviewCategory, number>>; liked?: string; disliked?: string }) {
    return request<{ data: Review }>(`/api/v1/bookings/${encodeURIComponent(bookingId)}/review`, { method: 'POST', body: JSON.stringify(input) }).then((result) => result.data);
  },
  getPartnerCoupons() {
    return request<{ data: PartnerCoupon[] }>('/api/v1/vendor/coupons').then((result) => result.data);
  },
  createPartnerCoupon(input: { code: string; kind: 'percent' | 'amount'; value: number; validUntil?: string; maxUses?: number }) {
    return request<{ data: PartnerCoupon }>('/api/v1/vendor/coupons', { method: 'POST', body: JSON.stringify(input) }).then((result) => result.data);
  },
  setPartnerCouponActive(couponId: string, active: boolean) {
    return request<{ data: PartnerCoupon }>(`/api/v1/vendor/coupons/${encodeURIComponent(couponId)}/active`, { method: 'POST', body: JSON.stringify({ active }) }).then((result) => result.data);
  },
  getPartnerReviews(params: { listingId?: string; page?: number } = {}) {
    return request<Paginated<Review>>(`/api/v1/vendor/reviews${queryString(params)}`);
  },
  replyToReview(reviewId: string, text: string) {
    return request<{ data: Review }>(`/api/v1/vendor/reviews/${encodeURIComponent(reviewId)}/reply`, { method: 'POST', body: JSON.stringify({ text }) }).then((result) => result.data);
  },
  reportReview(reviewId: string, reason: string) {
    return request<{ data: Review }>(`/api/v1/vendor/reviews/${encodeURIComponent(reviewId)}/report`, { method: 'POST', body: JSON.stringify({ reason }) }).then((result) => result.data);
  },

  getTeam() {
    return request<{ data: TeamMember[] }>('/api/v1/vendors/me/team').then((result) => result.data);
  },
  addTeamMember(input: { name: string; email: string; role: 'manager' | 'reservations' }) {
    return request<{ data: TeamMember; newAccount: boolean; passwordSetupSent?: boolean }>('/api/v1/vendors/me/team', { method: 'POST', body: JSON.stringify(input) });
  },
  removeTeamMember(memberId: string) {
    return request<void>(`/api/v1/vendors/me/team/${encodeURIComponent(memberId)}`, { method: 'DELETE' });
  },

  actOnVendorBooking(bookingId: string, action: VendorBookingAction, reason?: string) {
    return request<{ data: Booking }>(`/api/v1/vendor/bookings/${encodeURIComponent(bookingId)}/actions`, {
      method: 'POST', body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
    }).then((result) => result.data);
  },

  admin: {
    listReviews(params: { status?: 'reported' | 'hidden' | 'all'; page?: number; limit?: number } = {}) {
      return request<Paginated<Review>>(`/api/v1/admin/reviews${queryString(params)}`);
    },
    moderateReview(reviewId: string, action: 'hide' | 'restore' | 'dismiss', reason: string) {
      return request<{ data: Review }>(`/api/v1/admin/reviews/${encodeURIComponent(reviewId)}/moderate`, { method: 'POST', body: JSON.stringify({ action, reason }) }).then((result) => result.data);
    },
    createStaff(input: { name: string; email: string; role: 'admin' }) {
      return request<{ data: AdminUser; invitationSent: boolean }>('/api/v1/admin/users', {
        method: 'POST', body: JSON.stringify(input),
      });
    },
    listVendors(params: { status?: string; changes?: 'pending'; page?: number; limit?: number } = {}) {
      return request<Paginated<AdminVendor>>(`/api/v1/admin/vendors${queryString(params)}`);
    },
    decideVendorChanges(vendorId: string, decision: 'approved' | 'rejected', notes: string) {
      return request<{ data: AdminVendor }>(`/api/v1/admin/vendors/${encodeURIComponent(vendorId)}/changes/decision`, {
        method: 'POST', body: JSON.stringify({ decision, notes }),
      }).then((result) => result.data);
    },
    recheckIdentity(vendorId: string) {
      return request<{ data: IdentityCheck }>(`/api/v1/admin/vendors/${encodeURIComponent(vendorId)}/identity-check`, { method: 'POST' }).then((result) => result.data);
    },
    decideVendor(vendorId: string, decision: 'approved' | 'rejected' | 'suspended', notes: string) {
      return request<{ data: AdminVendor }>(`/api/v1/admin/vendors/${encodeURIComponent(vendorId)}/decision`, {
        method: 'POST', body: JSON.stringify({ decision, notes }),
      });
    },
    listListings(params: { status?: VendorListing['status'] | 'all' | 'revisions'; type?: VendorListing['type']; q?: string; page?: number; limit?: number } = {}) {
      return request<Paginated<VendorListing>>(`/api/v1/admin/listings${queryString(params)}`);
    },
    listListingRooms(listingId: string) {
      return request<{ data: VendorRoom[] }>(`/api/v1/admin/listings/${encodeURIComponent(listingId)}/rooms`).then((result) => result.data);
    },
    moderateListing(listingId: string, decision: 'published' | 'rejected', notes: string) {
      return request<{ data: VendorListing }>(`/api/v1/admin/listings/${encodeURIComponent(listingId)}/decision`, {
        method: 'POST', body: JSON.stringify({ decision, notes }),
      });
    },
    decideListingRevision(listingId: string, decision: 'approved' | 'rejected', notes: string) {
      return request<{ data: VendorListing }>(`/api/v1/admin/listings/${encodeURIComponent(listingId)}/revision/decision`, {
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
    findBooking(reference: string) {
      return request<{ data: AdminBookingLookup }>(`/api/v1/admin/bookings/lookup${queryString({ reference })}`).then((result) => result.data);
    },
    cancelBooking(bookingId: string, reason: string) {
      return request<{ data: Booking }>(`/api/v1/admin/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: 'POST', body: JSON.stringify({ reason }),
      }).then((result) => result.data);
    },
    getSettings() {
      return request<{ data: PlatformSettings }>('/api/v1/admin/settings').then((result) => result.data);
    },
    saveSettings(settings: PlatformSettings) {
      return request<{ data: PlatformSettings }>('/api/v1/admin/settings', { method: 'PUT', body: JSON.stringify(settings) }).then((result) => result.data);
    },
  },

  getWishlist() {
    return request<Listing[] | { data: Listing[] }>('/api/v1/wishlist').then(unwrapCollection);
  },

  removeWishlistItem(listingId: string) {
    return request<void>(`/api/v1/wishlist/${encodeURIComponent(listingId)}`, { method: 'DELETE' });
  },

  addWishlistItem(listingId: string) {
    return request<void>('/api/v1/wishlist', {
      method: 'POST',
      body: JSON.stringify({ listingId }),
    });
  },

};
