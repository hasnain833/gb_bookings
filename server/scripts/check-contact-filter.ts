/**
 * Self-check for hiding contact details in messages (no database needed): npx tsx server/scripts/check-contact-filter.ts
 */
import assert from 'node:assert/strict';
import { hideContacts } from '../modules/messages/contact-filter.js';

const hides = (text: string) => assert.equal(hideContacts(text).hidden, true, `should hide: ${text}`);
const keeps = (text: string) => assert.deepEqual(hideContacts(text), { text, hidden: false }, `should keep: ${text}`);

hides('call me on 03318787833');
hides('WhatsApp +92 331 8787833');
hides('my number is 0331-878-7833');
hides('0300 123 4567 anytime');
hides('mail me at ali.khan@gmail.com');
hides('ali [at] gmail [dot] com');
hides('book direct at www.myhotel.pk');
hides('see https://wa.me/923318787833');
hides('our site myguesthouse.com is cheaper');

keeps('We arrive on 22/10/2026 around 4pm.');
keeps('Is the price PKR 20,000 per night?');
keeps('Booking GB-51C847D6, 2 adults and 1 child.');
keeps('Can you arrange a jeep for 3 days, 2026-10-22 to 2026-10-25?');
keeps('Room 12, 3rd floor please.');

assert.equal(hideContacts('Call 03318787833 or mail a@b.com').text, 'Call [contact hidden] or mail [contact hidden]');
console.log('contact filter checks passed');
