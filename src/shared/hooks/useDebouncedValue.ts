import { useEffect, useState } from 'react';

/** Returns `value` once it has stopped changing for `delay` ms, so typing doesn't fire a request per keystroke. */
export function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
