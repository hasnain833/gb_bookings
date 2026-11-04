import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Router, type Request } from 'express';
import { env } from '../../config/env.js';
import { connectDatabase } from '../../database/connection.js';
import { ListingModel } from '../../models/listing.model.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { escapeHtml } from '../email/auth-email.templates.js';

/**
 * Crawlers get real HTML: each public page is the built index.html with its title, description and content filled in.
 * The app replaces #root when it starts, so people and crawlers see the same content.
 */
const CATEGORIES: Record<string, { type: string; title: string; description: string; unit: string }> = {
  hotels: { type: 'hotel', title: 'Hotels in Gilgit-Baltistan', description: 'Verified hotels in Hunza, Skardu, Gilgit and across Gilgit-Baltistan, with live availability and prices in PKR.', unit: 'night' },
  homestays: { type: 'homestay', title: 'Homestays in Gilgit-Baltistan', description: 'Stay with local families in Gilgit-Baltistan: verified homestays with home-cooked meals and prices in PKR.', unit: 'night' },
  cars: { type: 'car', title: 'Car and jeep rental in Gilgit-Baltistan', description: 'Rent cars and 4x4 jeeps in Gilgit-Baltistan, with a driver or self-drive, from verified local partners.', unit: 'day' },
  tours: { type: 'tour', title: 'Tours in Gilgit-Baltistan', description: 'Guided tours and treks across Gilgit-Baltistan from verified tour companies and local guides.', unit: 'person' },
};
const STATIC_PATHS = ['/', '/destinations', '/support', '/terms', '/privacy', '/refunds', '/service', '/become-partner'];
const SCHEMA_TYPE: Record<string, string> = { hotel: 'Hotel', homestay: 'LodgingBusiness', car: 'Product', tour: 'TouristTrip' };

const siteUrl = (request: Request) => (env.APP_URL ?? `${request.protocol}://${request.get('host')}`).replace(/\/$/, '');
const truncate = (text: string, length: number) => text.length <= length ? text : `${text.slice(0, length - 1).trimEnd()}…`;
const listingPath = (listing: any) => `/listing/${encodeURIComponent(listing.publicId)}`;

let template: string | undefined;
async function indexHtml() {
  // Cached only once built: dev rebuilds should show up.
  template ??= await readFile(path.join(process.cwd(), 'dist', 'index.html'), 'utf8');
  return template;
}

type Page = { title: string; description: string; canonical: string; image?: string; body: string; jsonLd?: unknown; noindex?: boolean };

/** Exported for the self-check. `<` is escaped in the JSON-LD so listing text cannot close the script tag. */
export function renderPage(html: string, page: Page) {
  const title = escapeHtml(`${truncate(page.title, 60)} | GBBookings`);
  const description = escapeHtml(truncate(page.description.replace(/\s+/g, ' '), 158));
  const url = escapeHtml(page.canonical);
  const head = [
    `<link rel="canonical" href="${url}" />`,
    page.noindex ? '<meta name="robots" content="noindex" />' : '',
    `<meta property="og:site_name" content="GBBookings" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    page.image ? `<meta property="og:image" content="${escapeHtml(page.image)}" />` : '',
    page.jsonLd ? `<script type="application/ld+json">${JSON.stringify(page.jsonLd).replace(/</g, '\\u003c')}</script>` : '',
  ].filter(Boolean).join('\n    ');
  // Functions as replacers: a listing title containing "$&" must stay plain text.
  return html
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${title}</title>`)
    .replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${description}" />`)
    .replace('</head>', () => `  ${head}\n  </head>`)
    .replace(/<div id="root">[\s\S]*?<\/div>\s*(?=<script)/, () => `<div id="root"><main style="max-width:720px;margin:0 auto;padding:32px 16px;font-family:system-ui,sans-serif">${page.body}</main></div>\n    `);
}

export const seoRouter = Router();

seoRouter.get('/robots.txt', (request, response) => {
  response.type('text/plain').send(`User-agent: *\nDisallow: /api/\nDisallow: /bookings\nDisallow: /profile\nDisallow: /inbox\nDisallow: /vendor-dashboard\nDisallow: /admin-dashboard\nDisallow: /listing/*/checkout\n\nSitemap: ${siteUrl(request)}/sitemap.xml\n`);
});

seoRouter.get('/sitemap.xml', asyncHandler(async (request, response) => {
  const base = siteUrl(request);
  const listings = await connectDatabase()
    ? await ListingModel.find({ status: 'published', deletedAt: null, type: { $in: ['hotel', 'homestay', 'car', 'tour'] } }).select('publicId updatedAt').limit(45_000).lean() as any[]
    : [];
  const urls = [
    ...[...STATIC_PATHS, ...Object.keys(CATEGORIES).map((name) => `/${name}`)].map((pathName) => `<url><loc>${base}${pathName}</loc></url>`),
    ...listings.map((listing) => `<url><loc>${base}${escapeHtml(listingPath(listing))}</loc><lastmod>${new Date(listing.updatedAt).toISOString().slice(0, 10)}</lastmod></url>`),
  ];
  response.set('Cache-Control', 'public, max-age=3600').type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
}));

seoRouter.get('/listing/:id', asyncHandler(async (request, response) => {
  const html = await indexHtml();
  const canonical = `${siteUrl(request)}/listing/${encodeURIComponent(request.params.id)}`;
  const listing = await connectDatabase()
    ? await ListingModel.findOne({ publicId: request.params.id, status: 'published', deletedAt: null }).lean() as any
    : null;
  if (!listing) {
    response.status(404).type('html').send(renderPage(html, { title: 'Listing not found', description: 'This listing is not available.', canonical, body: '<h1>Listing not found</h1>', noindex: true }));
    return;
  }
  const unit = listing.type === 'car' ? 'day' : listing.type === 'tour' ? 'person' : 'night';
  const body = `<h1>${escapeHtml(listing.title)}</h1><p>${escapeHtml(listing.location)}</p><p>From PKR ${Number(listing.price).toLocaleString('en-PK')} per ${unit}</p><p>${escapeHtml(truncate(listing.description, 1_500))}</p>`;
  const rated = listing.reviewsCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: listing.rating, reviewCount: listing.reviewsCount, bestRating: 5 } } : {};
  response.set('Cache-Control', 'public, max-age=300').type('html').send(renderPage(html, {
    title: listing.title, description: `${listing.location}. ${listing.description}`, canonical, image: listing.image, body,
    jsonLd: {
      '@context': 'https://schema.org', '@type': SCHEMA_TYPE[listing.type] ?? 'Product', name: listing.title, description: truncate(listing.description, 500), image: listing.image, url: canonical,
      ...(listing.type === 'hotel' || listing.type === 'homestay' ? { address: listing.location, priceRange: `From PKR ${listing.price}` } : { offers: { '@type': 'Offer', price: listing.price, priceCurrency: 'PKR', url: canonical } }),
      ...rated,
    },
  }));
}));

seoRouter.get(Object.keys(CATEGORIES).map((name) => `/${name}`), asyncHandler(async (request, response) => {
  const name = request.path.slice(1);
  const category = CATEGORIES[name];
  const listings = await connectDatabase()
    ? await ListingModel.find({ type: category.type, status: 'published', deletedAt: null }).sort({ featured: -1, rating: -1 }).limit(100).select('publicId title location price').lean() as any[]
    : [];
  const items = listings.map((listing) => `<li><a href="${escapeHtml(listingPath(listing))}">${escapeHtml(listing.title)}</a>, ${escapeHtml(listing.location)}, from PKR ${Number(listing.price).toLocaleString('en-PK')} per ${category.unit}</li>`).join('');
  response.set('Cache-Control', 'public, max-age=300').type('html').send(renderPage(await indexHtml(), {
    title: category.title, description: category.description, canonical: `${siteUrl(request)}/${name}`,
    body: `<h1>${escapeHtml(category.title)}</h1><p>${escapeHtml(category.description)}</p><ul>${items}</ul>`,
  }));
}));
