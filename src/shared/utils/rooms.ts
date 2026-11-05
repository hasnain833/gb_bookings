// Property types, room types, beds and bathrooms: one list for the wizard, the server checks and guest pages.

/** Kinds of property a hotel partner (front desk, rooms or pitches) can list. Older listings may hold other values. */
export const HOTEL_TYPES = ['Hotel', 'Guest House', 'Bed and breakfast', 'Hostel', 'Lodge', 'Motel', 'Resort', 'Boutique Hotel', 'Campsite', 'Glamping'] as const;
/** Kinds of property a host lists; each can be let as a whole or by the room. */
export const HOME_TYPES = ['Homestay', 'Apartment', 'Holiday home', 'Villa', 'Cottage / Chalet', 'Farm stay'] as const;

/** What guests can use at the property; one fixed list so search filters match (older listings may hold other words). */
export const FACILITIES = [
  'WiFi', 'Parking', 'Restaurant', 'Room service', '24-hour front desk', 'Heating', 'Hot water', 'Garden', 'Terrace',
  'Mountain view', 'Lake or river view', 'Airport pickup', 'Laundry', 'Family rooms', 'Non-smoking rooms', 'Kitchen access',
  'Bonfire area', 'Barbecue', 'Prayer area', 'Conference room', 'Tour desk', 'Luggage storage', 'Wheelchair accessible',
] as const;

export const BREAKFAST_KINDS = ['Desi', 'Continental', 'Local Gilgiti', 'Buffet', 'Halal', 'Vegetarian'] as const;

/** Breakfast (hotels), parking and licence: kept on hotelSpecs. Prices in PKR. */
export interface PropertyExtras {
  breakfast?: { offered: boolean; included: boolean; price?: number; kinds?: Array<typeof BREAKFAST_KINDS[number]> };
  parking?: { available: 'none' | 'free' | 'paid'; price?: number; onSite?: boolean; reservation?: boolean };
  licenceNumber?: string; stars?: number;
}

export interface PropertyAddress { line1: string; area?: string; city: string; region?: string; postcode?: string }
/** One-line address shown on cards and searched: "Main Bazaar, Aliabad, Hunza". */
export const addressLine = (address: PropertyAddress) => [address.line1, address.area, address.city].map((part) => part?.trim()).filter(Boolean).join(', ');

export const ROOM_TYPES = {
  single: 'Single room', double: 'Double room', twin: 'Twin room', twin_double: 'Double or twin room', triple: 'Triple room',
  quadruple: 'Quadruple room', family: 'Family room', suite: 'Suite', studio: 'Studio', dormitory: 'Dormitory bed',
  tent: 'Tent', cabin: 'Cabin / hut',
} as const;
export type RoomTypeKey = keyof typeof ROOM_TYPES;

/** Ready-made names per room type; partners can still type their own. */
export const ROOM_NAME_PRESETS: Record<RoomTypeKey, string[]> = {
  single: ['Standard Single Room', 'Single Room with Mountain View'],
  double: ['Standard Double Room', 'Deluxe Double Room', 'Double Room with Mountain View'],
  twin: ['Standard Twin Room', 'Deluxe Twin Room'],
  twin_double: ['Standard Double or Twin Room', 'Deluxe Double or Twin Room'],
  triple: ['Standard Triple Room', 'Deluxe Triple Room'],
  quadruple: ['Standard Quadruple Room'],
  family: ['Family Room', 'Family Suite'],
  suite: ['Junior Suite', 'Executive Suite'],
  studio: ['Studio', 'Studio with Kitchenette'],
  dormitory: ['Bed in Mixed Dormitory', 'Bed in Female Dormitory'],
  tent: ['Two-Person Tent', 'Family Tent', 'Luxury Tent'],
  cabin: ['Wooden Cabin', 'Stone Hut'],
};

export const BED_KINDS = {
  single: 'Single bed', double: 'Double bed', large_double: 'Large double bed', extra_large_double: 'Extra-large double bed',
  bunk: 'Bunk bed', sofa_bed: 'Sofa bed', floor_mattress: 'Floor mattress',
} as const;
export type BedKind = keyof typeof BED_KINDS;
export type Bed = { kind: BedKind; count: number };

export const BATHROOM_ITEMS = ['Toilet', 'Shower', 'Bath', 'Hot water', 'Towels', 'Toiletries', 'Hairdryer', 'Slippers'] as const;

/** The parts of a room that describe its beds and bathroom. Entire places use `bedrooms` and `bathrooms`. */
export interface RoomLayout {
  roomType?: RoomTypeKey;
  beds?: Bed[];
  bedrooms?: Array<{ beds: Bed[] }>;
  bathroom?: 'private' | 'shared';
  bathroomItems?: string[];
  bathrooms?: number;
  sizeSqm?: number;
  cots?: boolean;
}

const ROOM_LAYOUT_FIELDS = ['roomType', 'beds', 'bedrooms', 'bathroom', 'bathroomItems', 'bathrooms', 'sizeSqm', 'cots'] as const;

/** A stored room's layout as plain data, absent fields left out (database documents included). */
export function roomLayoutOf(room: Record<string, unknown>): RoomLayout {
  return Object.fromEntries(ROOM_LAYOUT_FIELDS
    .map((key) => [key, room[key] == null ? undefined : JSON.parse(JSON.stringify(room[key]))])
    .filter(([, value]) => value !== undefined));
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** "1 double bed · 2 single beds" */
export const describeBeds = (beds: Bed[]) => beds.filter((bed) => bed.count > 0)
  .map((bed) => plural(bed.count, BED_KINDS[bed.kind].toLowerCase())).join(' · ');

/** The short bed line shown everywhere (and stored as the room's `bedType`), or undefined when no beds are given. */
export function bedSummary(layout: RoomLayout): string | undefined {
  if (layout.bedrooms?.length) {
    const beds = layout.bedrooms.reduce((total, room) => total + room.beds.reduce((sum, bed) => sum + bed.count, 0), 0);
    return `${plural(layout.bedrooms.length, 'bedroom')} · ${plural(beds, 'bed')}`;
  }
  return layout.beds?.length ? describeBeds(layout.beds) || undefined : undefined;
}

/** Guest-facing facts after the bed line: "Private bathroom · 18 m²" or "2 bathrooms · 90 m² · Cot available". */
export function roomFacts(layout: RoomLayout) {
  return [
    layout.bathrooms ? plural(layout.bathrooms, 'bathroom') : layout.bathroom && (layout.bathroom === 'private' ? 'Private bathroom' : 'Shared bathroom'),
    layout.sizeSqm && `${layout.sizeSqm} m²`,
    layout.cots && 'Cot available',
  ].filter(Boolean) as string[];
}
