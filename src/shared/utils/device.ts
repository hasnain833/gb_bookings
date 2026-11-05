/** "Chrome on Windows" from a user-agent string; scripts and tools read as such. */
export function deviceName(userAgent: string) {
  const ua = userAgent || '';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : null;
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iPhone' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : null;
  if (browser) return os ? `${browser} on ${os}` : browser;
  if (/^(node|curl|axios|python|postman|undici)/i.test(ua)) return 'App or script (not a browser)';
  return ua ? ua.slice(0, 40) : 'Unknown device';
}
