/**
 * Self-check for the CNIC pre-check rules (no database, no AI).
 * Run: npx tsx server/scripts/check-identity.ts
 */
import assert from 'node:assert/strict';
import { judgeCnic, namesMatch, type CnicRead } from '../modules/vendors/identity-check.js';

assert.ok(namesMatch('Muhammad Ali Khan', 'Ali Khan'));
assert.ok(namesMatch('ALI KHAN', 'ali  khan'));
assert.ok(!namesMatch('Ali Khan', 'Sara Baig'));
assert.ok(!namesMatch('', 'Ali Khan'));

const read: CnicRead = { isCnic: true, readable: true, name: 'Ali Khan', cnicNumber: '71101-1234567-1', expiryDate: '2031-05-01' };
const judge = (patch: Partial<CnicRead>, typedCnic = '71101-1234567-1') =>
  judgeCnic({ typedCnic, accountName: 'Muhammad Ali Khan', read: { ...read, ...patch }, today: '2026-10-22' });
const levels = (findings: ReturnType<typeof judge>) => findings.map((finding) => finding.level);

assert.deepEqual(levels(judge({})), ['ok', 'ok', 'ok']);
assert.deepEqual(levels(judge({ isCnic: false })), ['fail']);
assert.deepEqual(levels(judge({ readable: false })), ['warn']);
assert.equal(judge({}, '71101-7654321-1')[0].level, 'fail', 'typed number differs');
assert.equal(judge({ cnicNumber: '7110112345671' })[0].level, 'ok', 'dashes do not matter');
assert.equal(judge({ name: 'Sara Baig' })[1].level, 'warn', 'name mismatch is a warning, not a failure');
assert.equal(judge({ expiryDate: '2025-01-01' })[2].level, 'fail', 'expired');
assert.equal(judge({ expiryDate: 'lifetime' })[2].level, 'ok');
assert.deepEqual(judgeCnic({ typedCnic: 'x', accountName: 'y', read: null, today: '2026-10-22' }), []);
console.log('identity check rules passed');
