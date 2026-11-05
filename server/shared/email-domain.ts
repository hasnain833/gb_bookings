import { promises as dns } from 'node:dns';

// Asked directly: a local network's own DNS can hide whether a domain exists.
const resolver = new dns.Resolver({ timeout: 2500, tries: 1 });
resolver.setServers(['1.1.1.1', '8.8.8.8']);

const POPULAR_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
// One letter away from a popular domain, but real.
const NOT_TYPOS = new Set(['mail.com', 'ymail.com', 'email.com', 'gmx.com', 'rocketmail.com']);

/** At most one letter added, dropped, changed, or swapped with its neighbour. */
function oneEditApart(a: string, b: string) {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  if (a.length === b.length && a[start] === b[start + 1] && a[start + 1] === b[start] && a.slice(start + 2) === b.slice(start + 2)) return true;
  const rest = (x: string, skip: number) => x.slice(start + skip);
  if (a.length === b.length) return rest(a, 1) === rest(b, 1);
  return a.length > b.length ? rest(a, 1) === rest(b, 0) : rest(a, 0) === rest(b, 1);
}

export function likelyTypoOf(domain: string) {
  return NOT_TYPOS.has(domain) ? undefined : POPULAR_DOMAINS.find((popular) => oneEditApart(domain, popular));
}

/**
 * True unless the domain clearly can't take mail: it doesn't exist, has no mail servers, or says so itself (a null MX).
 * Any other DNS failure may be temporary and isn't the visitor's fault, so it lets them through.
 */
export async function domainAcceptsMail(domain: string) {
  try {
    const servers = await resolver.resolveMx(domain);
    return servers.some((server) => server.exchange && server.exchange !== '.');
  } catch (error: any) {
    return !['ENOTFOUND', 'ENODATA'].includes(error.code);
  }
}

/** The message to show for an address that can't be right, or null if it may be fine. */
export async function emailAddressProblem(email: string) {
  const [localPart, domain] = email.split('@');
  const typoOf = likelyTypoOf(domain);
  if (typoOf) return `Did you mean ${localPart}@${typoOf}?`;
  return await domainAcceptsMail(domain) ? null : `${domain} can't receive email. Please check the address.`;
}
