import { Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

type OptionData = { value: string; label: string; disabled: boolean };
type SelectProps = {
  value?: string | number;
  onChange?: (event: { target: { value: string; name?: string } }) => void;
  children?: ReactNode;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  title?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

const text = (node: ReactNode): string => Children.toArray(node).map((child) => typeof child === 'string' || typeof child === 'number' ? String(child) : isValidElement(child) ? text((child.props as { children?: ReactNode }).children) : '').join('');

/** Reads the same <option> children a native select takes, however they are nested in arrays or fragments. */
function readOptions(children: ReactNode): OptionData[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const element = child as ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>;
    if (element.type !== 'option') return readOptions(element.props.children);
    const label = text(element.props.children);
    return [{ value: element.props.value === undefined ? label : String(element.props.value), label, disabled: Boolean(element.props.disabled) }];
  });
}

const SLOTS = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`);
const slotLabel = (time: string) => { const [hour, minute] = time.split(':').map(Number); return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`; };

/** Our own time picker, in half-hour steps. An older value off that grid stays selectable. */
export function TimeInput({ value = '', required, ...props }: Omit<SelectProps, 'children' | 'value'> & { value?: string }) {
  const slots = value && !SLOTS.includes(value) ? [...SLOTS, value].sort() : SLOTS;
  return <Select value={value} required={required} {...props}>
    {!required && <option value="">Not set</option>}
    {required && !value && <option value="">Select time</option>}
    {slots.map((time) => <option key={time} value={time}>{slotLabel(time)}</option>)}
  </Select>;
}

/** Our own dropdown. Takes the same props and <option> children as a native select, so it is a drop-in replacement. */
export default function Select({ value, onChange, children, className = '', id, name, disabled, required, title, ...aria }: SelectProps) {
  const options = readOptions(children);
  const current = String(value ?? options[0]?.value ?? '');
  const selected = options.find((option) => option.value === current);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState<CSSProperties>({});
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();
  const typed = useRef({ text: '', at: 0 });

  useLayoutEffect(() => {
    if (!open || !trigger.current) return;
    const box = trigger.current.getBoundingClientRect();
    const below = window.innerHeight - box.bottom;
    const up = below < 240 && box.top > below;
    const width = Math.max(box.width, 160);
    setPosition({ position: 'fixed', left: Math.max(8, Math.min(box.left, window.innerWidth - width - 8)), width, maxHeight: Math.min(288, (up ? box.top : below) - 12), ...(up ? { bottom: window.innerHeight - box.top + 4 } : { top: box.bottom + 4 }) });
    setActive(Math.max(0, options.findIndex((option) => option.value === current)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Scrolls the list only, never the page behind it.
  useEffect(() => {
    const box = list.current;
    const item = box?.children[active] as HTMLElement | undefined;
    if (!box || !item) return;
    if (item.offsetTop < box.scrollTop) box.scrollTop = item.offsetTop;
    else if (item.offsetTop + item.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = item.offsetTop + item.offsetHeight - box.clientHeight;
  }, [active, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event: MouseEvent) => { if (!list.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false); };
    const onScroll = (event: Event) => { if (!list.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onScroll); };
  }, [open]);

  const choose = (option: OptionData | undefined) => {
    if (!option || option.disabled) return;
    setOpen(false);
    trigger.current?.focus();
    if (option.value !== current) onChange?.({ target: { value: option.value, name } });
  };

  const move = (from: number, step: number) => {
    for (let index = from + step; index >= 0 && index < options.length; index += step) if (!options[index].disabled) return index;
    return from;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (disabled) return;
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); return; }
    if (event.key === 'Tab') { setOpen(false); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      if (event.key === 'ArrowDown') setActive((index) => move(index, 1));
      if (event.key === 'ArrowUp') setActive((index) => move(index, -1));
      if (event.key === 'Home') setActive(move(-1, 1));
      if (event.key === 'End') setActive(move(options.length, -1));
      if (event.key === 'Enter' || event.key === ' ') choose(options[active]);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      // Typing jumps to the matching option.
      const now = Date.now();
      typed.current = { text: (now - typed.current.at > 700 ? '' : typed.current.text) + event.key.toLowerCase(), at: now };
      const match = options.findIndex((option) => !option.disabled && option.label.toLowerCase().startsWith(typed.current.text));
      if (match >= 0) { setActive(match); if (!open) setOpen(true); }
    }
  };

  return <>
    <button ref={trigger} type="button" id={id} role="combobox" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined}
      aria-activedescendant={open ? `${listId}-${active}` : undefined} disabled={disabled} title={title} {...aria}
      onClick={() => setOpen((value) => !value)} onKeyDown={onKeyDown}
      className={`${className} inline-flex items-center justify-between gap-2 text-start disabled:cursor-not-allowed disabled:opacity-60`}>
      <span className={`min-w-0 truncate ${selected?.value ? '' : 'text-slate-500'}`}>{selected?.label ?? ''}</span>
      <ChevronDown className={`size-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>
    {name && <input type="hidden" name={name} value={current} />}
    {required && <input tabIndex={-1} aria-hidden="true" required value={selected?.value ?? ''} onChange={() => undefined} className="sr-only" />}
    {open && createPortal(<ul ref={list} id={listId} role="listbox" style={position} className="fixed z-[250] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-xl animate-fadeIn">
      {options.map((option, index) => <li key={`${option.value}-${index}`} id={`${listId}-${index}`} role="option" aria-selected={option.value === current} aria-disabled={option.disabled}
        onMouseEnter={() => setActive(index)} onClick={() => choose(option)}
        className={`flex min-h-10 cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 ${option.disabled ? 'cursor-not-allowed text-slate-400' : index === active ? 'bg-emerald-50 text-slate-900' : 'text-slate-700'} ${option.value === current ? 'font-semibold' : ''}`}>
        <span className="min-w-0">{option.label}</span>{option.value === current && <Check className="size-4 shrink-0 text-[#006F3C]" aria-hidden="true" />}
      </li>)}
    </ul>, document.querySelector('dialog[open]') ?? document.body)}
  </>;
}
