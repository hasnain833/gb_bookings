import { describe, expect, it } from 'vitest';
import { databaseConnectionHint } from '../database/connection.js';

describe('databaseConnectionHint', () => {
  it('identifies Atlas TLS and network access failures', () => {
    const hint = databaseConnectionHint(new Error('tlsv1 alert internal error'));

    expect(hint).toContain('Atlas Network Access');
    expect(hint).toContain('27017');
  });

  it('identifies credential failures', () => {
    const hint = databaseConnectionHint(new Error('MongoServerError: bad auth'));

    expect(hint).toContain('username/password');
  });

  it('identifies DNS failures', () => {
    const hint = databaseConnectionHint(new Error('querySrv ETIMEOUT _mongodb._tcp.example'));

    expect(hint).toContain('DNS lookup failed');
  });
});
