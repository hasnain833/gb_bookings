export const PASSWORD_REQUIREMENTS = 'Use at least 8 characters, including an uppercase letter, a lowercase letter, a number and a special character.';
export const PASSWORD_PATTERN = '(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\\s]).{8,72}';

export function passwordChecks(password: string) {
  return [
    { label: 'At least 8 characters', valid: password.length >= 8 },
    { label: 'An uppercase letter (A–Z)', valid: /[A-Z]/.test(password) },
    { label: 'A lowercase letter (a–z)', valid: /[a-z]/.test(password) },
    { label: 'A number (0–9)', valid: /[0-9]/.test(password) },
    { label: 'A special character (e.g. !@#$)', valid: /[^A-Za-z0-9\s]/.test(password) },
  ];
}

export function isValidPassword(password: string) {
  return passwordChecks(password).every((check) => check.valid) && new TextEncoder().encode(password).length <= 72;
}
