import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isValid, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const iso = (date: Date) => format(date, 'yyyy-MM-dd');
const WIDTH = 304;
const HEIGHT = 372;

type DateInputProps = {
  value?: string;
  onChange?: (event: { target: { value: string; name?: string } }) => void;
  /** Earliest and latest choosable days, YYYY-MM-DD. */
  min?: string;
  max?: string;
  /** Days that cannot be chosen, e.g. sold out. */
  unavailable?: ReadonlySet<string>;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  title?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

/** Our own date picker. Takes the same props as <input type="date"> and also reports YYYY-MM-DD. */
export default function DateInput({ value = '', onChange, min, max, unavailable, className = '', id, name, disabled, required, placeholder = 'Select date', title, ...aria }: DateInputProps) {
  const parsed = value && isValid(parseISO(value)) ? parseISO(value) : null;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => parsed ?? new Date());
  const [focusDay, setFocusDay] = useState(iso(parsed ?? new Date()));
  const [position, setPosition] = useState<CSSProperties>({});
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const blocked = (day: string) => Boolean((min && day < min) || (max && day > max) || unavailable?.has(day));

  useLayoutEffect(() => {
    if (!open || !trigger.current) return;
    const box = trigger.current.getBoundingClientRect();
    const up = window.innerHeight - box.bottom < HEIGHT && box.top > window.innerHeight - box.bottom;
    setPosition({ position: 'fixed', left: Math.max(8, Math.min(box.left, window.innerWidth - WIDTH - 8)), width: WIDTH, ...(up ? { bottom: Math.max(8, window.innerHeight - box.top + 4) } : { top: Math.max(8, Math.min(box.bottom + 4, window.innerHeight - HEIGHT - 8)) }) });
    const start = parsed ?? (min && isValid(parseISO(min)) ? parseISO(min) : new Date());
    setMonth(start);
    setFocusDay(iso(start));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event: MouseEvent) => { if (!panel.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false); };
    const onScroll = (event: Event) => { if (!panel.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onScroll); };
  }, [open]);

  const pick = (day: string) => {
    if (blocked(day)) return;
    setOpen(false);
    trigger.current?.focus();
    onChange?.({ target: { value: day, name } });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (disabled) return;
    if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); return; }
    if (event.key === 'Tab') { setOpen(false); return; }
    const step = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[event.key];
    if (step || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      if (step) {
        const next = addDays(parseISO(focusDay), step);
        setFocusDay(iso(next));
        setMonth(next);
      } else pick(focusDay);
    }
  };

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) });
  const today = iso(new Date());
  const earlier = addMonths(month, -1);
  const canGoBack = !min || iso(endOfMonth(earlier)) >= min;
  const canGoNext = !max || iso(startOfMonth(addMonths(month, 1))) <= max;

  return <>
    <button ref={trigger} type="button" id={id} aria-haspopup="dialog" aria-expanded={open} disabled={disabled} title={title} {...aria}
      onClick={() => setOpen((value) => !value)} onKeyDown={onKeyDown}
      className={`${className} inline-flex items-center justify-between gap-2 text-start font-normal disabled:cursor-not-allowed disabled:opacity-60`}>
      <span className={`min-w-0 truncate ${parsed ? 'text-slate-900' : 'text-slate-500'}`}>{parsed ? format(parsed, 'dd MMM yyyy') : placeholder}</span>
      <Calendar className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
    </button>
    {name && <input type="hidden" name={name} value={value} />}
    {required && <input tabIndex={-1} aria-hidden="true" required value={value} onChange={() => undefined} className="sr-only" />}
    {open && createPortal(<div ref={panel} role="dialog" aria-label="Choose a date" style={position} className="fixed z-[250] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl animate-fadeIn">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Previous month" disabled={!canGoBack} onClick={() => setMonth(earlier)} className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="size-4 rtl:rotate-180" /></button>
        <span className="text-sm font-bold text-slate-900" aria-live="polite">{format(month, 'MMMM yyyy')}</span>
        <button type="button" aria-label="Next month" disabled={!canGoNext} onClick={() => setMonth(addMonths(month, 1))} className="flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="size-4 rtl:rotate-180" /></button>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-semibold text-slate-500">{WEEK_DAYS.map((day) => <span key={day} className="py-1">{day}</span>)}</div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((date) => {
          const day = iso(date);
          const off = blocked(day);
          const soldOut = unavailable?.has(day) && !(min && day < min) && !(max && day > max);
          return <button key={day} type="button" disabled={off} aria-pressed={day === value} aria-label={`${format(date, 'd MMMM yyyy')}${soldOut ? ', not available' : ''}`} title={soldOut ? 'Not available' : undefined} onClick={() => pick(day)}
            className={`flex h-9 items-center justify-center rounded-lg text-sm ${day === value ? 'bg-[#006F3C] font-bold text-white'
              : off ? `cursor-not-allowed text-slate-300 ${soldOut ? 'line-through' : ''}`
                : `${isSameMonth(date, month) ? 'text-slate-800' : 'text-slate-400'} hover:bg-emerald-50 ${day === focusDay ? 'ring-1 ring-[#006F3C]/40' : ''}`} ${day === today && day !== value ? 'font-bold underline underline-offset-2' : ''}`}>
            {format(date, 'd')}
          </button>;
        })}
      </div>
      {unavailable && unavailable.size > 0 && <p className="mt-2 text-[11px] text-slate-500"><span className="text-slate-300 line-through">12</span> means fully booked or closed.</p>}
      {value && !required && <button type="button" onClick={() => { setOpen(false); onChange?.({ target: { value: '', name } }); }} className="mt-2 min-h-9 w-full rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100">Clear date</button>}
    </div>, document.querySelector('dialog[open]') ?? document.body)}
  </>;
}
