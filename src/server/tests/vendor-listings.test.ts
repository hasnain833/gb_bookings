import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp, finalizeApp } from '../app.js';
import { createHotelListingSchema, roomTypeSchema } from '../modules/vendor-listings/vendor-listing.schemas.js';

function testApp() { return finalizeApp(createApp()); }

describe('vendor hotel management', () => {
  it('protects vendor-owned listings', async () => {
    const response = await request(testApp()).get('/api/v1/vendor/listings');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('protects the listing moderation queue', async () => {
    const response = await request(testApp()).get('/api/v1/admin/listings');
    expect(response.status).toBe(401);
  });

  it('accepts a complete hotel draft payload', () => {
    const result = createHotelListingSchema.safeParse({
      title: 'Mountain View Hotel', location: 'Hunza', description: 'A complete hotel description for travelers.',
      price: 12500, imageIds: [`med_${'a'.repeat(8)}-${'b'.repeat(4)}-${'c'.repeat(4)}-${'d'.repeat(4)}-${'e'.repeat(12)}`],
      hotelSpecs: { hotelType: 'Boutique', amenities: ['WiFi'], facilities: ['Parking'], policies: ['No smoking'], checkInTime: '14:00', checkOutTime: '11:00' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects room categories without positive inventory', () => {
    const result = roomTypeSchema.safeParse({
      name: 'Deluxe', bedType: 'King', maxAdults: 2, maxChildren: 1,
      totalRooms: 0, basePrice: 12000, amenities: [],
    });
    expect(result.success).toBe(false);
  });
});
