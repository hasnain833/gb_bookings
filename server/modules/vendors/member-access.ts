// Which partner-team roles may use each area. The services check these, and the partner dashboard shows only these areas.
export const MEMBER_ACCESS = {
  listings: ['owner', 'manager', 'listings'],
  reservations: ['owner', 'manager', 'reservations'],
  reports: ['owner', 'manager', 'finance'],
  team: ['owner'],
  business: ['owner'],
} as const;

export type MemberArea = keyof typeof MEMBER_ACCESS;

export const canAccess = (role: string, area: MemberArea) => (MEMBER_ACCESS[area] as readonly string[]).includes(role);
export const accessFor = (role: string) => (Object.keys(MEMBER_ACCESS) as MemberArea[]).filter((area) => canAccess(role, area));
