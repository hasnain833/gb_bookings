import { useEffect } from 'react';

const MESSAGE_CLASS = 'gb-field-error';

function messageFor(field: HTMLInputElement) {
  const v = field.validity;
  if (v.valueMissing) return field.type === 'checkbox' ? 'Please tick this box to continue.' : field.type === 'email' ? 'Enter your email address.' : 'This field is required.';
  if (v.typeMismatch && field.type === 'email') return 'Enter a valid email address, like name@example.com.';
  if (v.typeMismatch && field.type === 'url') return 'Enter a full web address, starting with https://';
  if (v.patternMismatch) return field.title || 'This doesn’t look right. Please check it.';
  if (v.tooShort) return `Use at least ${field.minLength} characters.`;
  if (v.tooLong) return `Use at most ${field.maxLength} characters.`;
  if (v.rangeUnderflow) return `The lowest allowed is ${field.min}.`;
  if (v.rangeOverflow) return `The highest allowed is ${field.max}.`;
  if (v.stepMismatch) return 'Enter a whole number.';
  if (v.badInput) return 'Enter a number.';
  return field.validationMessage;
}

function clear(field: Element) {
  field.removeAttribute('aria-invalid');
  const next = field.nextElementSibling;
  if (next?.classList.contains(MESSAGE_CLASS)) next.remove();
}

/**
 * Replaces the browser's validation bubbles everywhere: "required", "pattern", "min" and the rest keep working,
 * but the message appears under the field in our own style. Renders nothing.
 */
export default function FormValidation() {
  useEffect(() => {
    let focused = false;
    const onInvalid = (event: Event) => {
      const field = event.target as HTMLInputElement;
      event.preventDefault();
      clear(field);
      field.setAttribute('aria-invalid', 'true');
      const message = document.createElement('p');
      message.className = `${MESSAGE_CLASS} mt-1 text-xs font-medium text-rose-700`;
      message.setAttribute('role', 'alert');
      message.textContent = messageFor(field);
      field.after(message);
      if (!focused) {
        // Only the first bad field in a submit takes the focus.
        focused = true;
        field.focus({ preventScroll: true });
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => { focused = false; }, 0);
      }
    };
    const onChange = (event: Event) => clear(event.target as Element);
    document.addEventListener('invalid', onInvalid, true);
    document.addEventListener('input', onChange, true);
    document.addEventListener('change', onChange, true);
    return () => {
      document.removeEventListener('invalid', onInvalid, true);
      document.removeEventListener('input', onChange, true);
      document.removeEventListener('change', onChange, true);
    };
  }, []);
  return null;
}
