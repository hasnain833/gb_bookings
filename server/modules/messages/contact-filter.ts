/**
 * Keeps guests and partners talking on GBBookings: phone numbers, emails and links in a message are replaced
 * before it is stored, so neither side can see them. Dates (8 digits), prices and booking references pass.
 * ponytail: pattern-based; numbers spelled out in words ("zero three one...") get through. Add a word list if abused.
 */
const HIDDEN = '[contact hidden]';

const EMAIL = /[\w.+-]+\s*(?:@|\(at\)|\[at\])\s*[\w-]+(?:\s*(?:\.|\(dot\)|\[dot\])\s*[\w-]+)+/gi;
const LINK = /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+\.(?:com|pk|net|org|io|me|co|info|app|link|ly)(?:\/\S*)?\b/gi;
// Digit runs with spaces, dashes, dots or brackets between them; 10+ digits reads as a phone number.
const DIGIT_RUN = /\+?\(?\d[\d\s().-]{7,}\d/g;

export function hideContacts(text: string) {
  let hidden = false;
  const out = text
    .replace(EMAIL, () => { hidden = true; return HIDDEN; })
    .replace(LINK, () => { hidden = true; return HIDDEN; })
    .replace(DIGIT_RUN, (match) => {
      if (match.replace(/\D/g, '').length < 10) return match;
      hidden = true;
      return HIDDEN;
    });
  return { text: out, hidden };
}
