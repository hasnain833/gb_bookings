import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  Filter,
  Heart,
  MapPin,
  Search,
  Star,
  type LucideIcon,
} from "lucide-react";
import { handleImageError, type Listing } from "../../types";
import { CalendarPickerDropdown } from "../../shared/components/CalendarPickerDropdown";

/** Shared building blocks for the Hotels, Homestays, Cars and Tours landing pages. */

const today = () => new Date().toISOString().split("T")[0];

const formatDate = (value: string) => {
  const date = new Date(value);
  return value && !isNaN(date.getTime())
    ? date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Add date";
};

/** Closes `onOutside` when a mousedown lands outside the returned ref. */
function useClickOutside<T extends HTMLElement>(
  active: boolean,
  onOutside: () => void,
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!active) return undefined;
    const handle = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node))
        onOutside();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [active, onOutside]);
  return ref;
}

// ---------- Hero ----------

export function LandingHero({
  id,
  image,
  alt,
  icon: Icon,
  eyebrow,
  title,
  subtitle,
}: {
  id: string;
  image: string;
  alt: string;
  icon: LucideIcon;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
}) {
  return (
    <section
      className="relative w-full rounded-2xl mt-0 sm:mt-1 overflow-hidden min-h-[280px] sm:min-h-[320px] lg:min-h-[350px] shadow-md"
      id={`${id}-hero-banner`}>
      <div className="absolute inset-0 z-0">
        <img
          src={image}
          alt={alt}
          className="w-full h-full object-cover object-center scale-105"
          referrerPolicy="no-referrer"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-slate-950/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-6 sm:pt-10 md:pt-14 pb-16 sm:pb-20 flex flex-col items-start text-left">
        <div className="lg:w-10/12 space-y-3 sm:space-y-3.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-slate-900/80 border border-white/30 text-white text-[11px] sm:text-xs backdrop-blur-md shadow-md">
            <Icon className="w-3.5 h-3.5 text-[#006F3C] shrink-0" />
            <span className="tracking-tight font-medium">{eyebrow}</span>
          </div>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight leading-snug drop-shadow-md">
            {title}
          </h1>
          <p className="text-slate-100/95 text-xs sm:text-sm font-medium max-w-xl leading-relaxed drop-shadow-xs">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------- Search console and fields ----------

export function SearchConsole({
  id,
  icon: Icon,
  title,
  submitLabel,
  onSubmit,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  submitLabel: string;
  onSubmit: () => void;
  children: ReactNode;
}) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <section
      className="-mt-12 sm:-mt-14 relative z-20 w-full"
      id={`${id}-search-console`}>
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-lg">
        <div className="flex border-b border-[#F1F5F9] bg-[#FAFAFA] px-6 sm:px-8 rounded-t-2xl">
          <div className="flex items-center gap-2.5 py-4 px-1 border-b-2 border-[#006F3C] text-[#006F3C] font-bold text-sm">
            <Icon className="w-4 h-4" />
            <span>{title}</span>
          </div>
        </div>
        <form
          onSubmit={submit}
          className="p-4 sm:p-6 bg-slate-50/50 rounded-b-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-3.5 items-stretch relative">
            {children}
            <div className="lg:col-span-2 flex items-stretch">
              <button
                type="submit"
                className="w-full min-h-[50px] bg-[#006F3C] hover:bg-[#005C32] text-white rounded-xl flex items-center justify-center gap-2 px-6 py-3.5 transition-colors text-[14px] font-semibold shadow-sm">
                <Search className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span className="whitespace-nowrap">{submitLabel}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

const fieldBox =
  "bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-center space-y-1 relative";
const fieldLabel = "text-[11px] font-bold text-slate-700 tracking-tight";
const fieldValue =
  "text-[13px] font-bold text-slate-800 select-none whitespace-nowrap truncate";

/** A clickable field that opens a popover; `span` is the lg grid column span class. */
export function PopoverField({
  label,
  icon: Icon,
  value,
  span,
  chevron = true,
  children,
}: {
  label: string;
  icon: LucideIcon;
  value: ReactNode;
  span: string;
  chevron?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useClickOutside<HTMLDivElement>(open, close);
  return (
    <div
      ref={ref}
      onClick={() => setOpen(!open)}
      className={`${fieldBox} ${span} cursor-pointer group`}>
      <label className={`${fieldLabel} cursor-pointer`}>{label}</label>
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-slate-500 group-hover:text-[#006F3C] transition-colors shrink-0" />
          <span className={fieldValue}>{value}</span>
        </div>
        {chevron && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
          />
        )}
      </div>
      {open && children(close)}
    </div>
  );
}

export function DateField({
  label,
  value,
  onChange,
  minDate = today(),
  span = "lg:col-span-2",
}: {
  label: string;
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  span?: string;
}) {
  return (
    <PopoverField
      label={label}
      icon={Calendar}
      value={formatDate(value)}
      span={span}
      chevron={false}>
      {(close) => (
        <CalendarPickerDropdown
          title={label}
          selectedDate={value}
          minDate={minDate}
          onChange={onChange}
          onClose={close}
        />
      )}
    </PopoverField>
  );
}

/** The dropdown panel under a PopoverField. Clicks inside don't toggle the field. */
export function Popover({
  width = "max-w-[320px]",
  padded = true,
  children,
}: {
  width?: string;
  padded?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className={`absolute top-full left-0 sm:left-auto right-0 sm:right-auto mt-2 w-[calc(100vw-32px)] ${width} bg-white rounded-2xl shadow-lg border border-slate-200 z-50 ${padded ? "p-4 space-y-4" : "p-2 space-y-1"}`}>
      {children}
    </div>
  );
}

export function PopoverDone({ onClick }: { onClick: () => void }) {
  return (
    <div className="border-t border-slate-100 pt-3 flex justify-end">
      <button
        type="button"
        onClick={onClick}
        className="bg-[#006F3C] hover:bg-[#005C32] text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors">
        Done
      </button>
    </div>
  );
}

export function CounterRow({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  divided = false,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  divided?: boolean;
}) {
  const stepClass =
    "w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100";
  return (
    <div
      className={`flex items-center justify-between ${divided ? "border-t border-slate-100 pt-3" : ""}`}>
      <div>
        <p className="text-xs font-bold text-slate-800">{label}</p>
        <p className="text-[10px] text-slate-500">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Fewer ${label.toLowerCase()}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          className={stepClass}>
          -
        </button>
        <span className="text-xs font-bold w-4 text-center">{value}</span>
        <button
          type="button"
          aria-label={`More ${label.toLowerCase()}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={stepClass}>
          +
        </button>
      </div>
    </div>
  );
}

export interface PlaceOption {
  name: string;
  region: string;
  desc: string;
}

/** Free-text place input with a suggestion list. The default value is cleared on focus so typing starts fresh. */
export function PlaceField({
  label,
  placeholder,
  heading,
  value,
  defaultValue,
  options,
  onChange,
  span = "lg:col-span-3",
}: {
  label: string;
  placeholder: string;
  heading: string;
  value: string;
  defaultValue: string;
  options: PlaceOption[];
  onChange: (value: string) => void;
  span?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));
  const term = (query || value).toLowerCase();
  const matches = options.filter((item) =>
    [item.name, item.region, item.desc].some((text) =>
      text.toLowerCase().includes(term),
    ),
  );

  return (
    <div ref={ref} className={`${fieldBox} ${span}`}>
      <label className={fieldLabel}>{label}</label>
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          type="text"
          value={open ? query : value}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery(value === defaultValue ? "" : value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 focus:outline-none p-0 placeholder-slate-400"
        />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-slate-200 z-50 max-h-72 overflow-y-auto p-2 space-y-1">
          <div className="px-3 py-1.5 text-xs font-medium text-slate-400 border-b border-slate-100">
            {heading}
          </div>
          {matches.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500">
              No locations match &quot;{query}&quot;
            </div>
          )}
          {matches.map((item) => (
            <div
              key={item.name}
              onClick={() => {
                onChange(item.name);
                setQuery(item.name);
                setOpen(false);
              }}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#006F3C] flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {item.region}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Sections ----------

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: ReactNode;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
      <div className="space-y-1">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006F3C] hover:text-[#005C32] hover:underline">
        <span>{actionLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export interface LandingCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  bgImage: string;
  iconBg: string;
}

export function CategoryGrid({
  title,
  subtitle,
  viewAllLabel,
  categories,
  selected,
  onSelect,
}: {
  title: string;
  subtitle: string;
  viewAllLabel: string;
  categories: LandingCategory[];
  selected: string;
  onSelect: (title: string) => void;
}) {
  return (
    <section className="space-y-6 pt-4">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        actionLabel={viewAllLabel}
        onAction={() => onSelect("All")}
      />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {categories.map(
          ({
            id,
            title: name,
            subtitle: hint,
            icon: Icon,
            bgImage,
            iconBg,
          }) => {
            const isSelected = selected === name;
            return (
              <div
                key={id}
                onClick={() => onSelect(isSelected ? "All" : name)}
                className={`relative h-44 sm:h-52 rounded-2xl overflow-hidden cursor-pointer group shadow-2xs hover:shadow-md transition-all duration-300 border-2 ${isSelected ? "border-[#006F3C] ring-4 ring-emerald-500/20" : "border-transparent"}`}>
                <img
                  src={bgImage}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
                <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between text-white z-10">
                  {isSelected && (
                    <div className="self-start px-2.5 py-0.5 sm:py-1 rounded-full bg-[#006F3C] text-[10px] font-bold shadow-md">
                      Filtered
                    </div>
                  )}
                  <div className="mt-auto flex items-end justify-between gap-1.5 sm:gap-2">
                    <div className="space-y-0.5 pr-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base lg:text-lg leading-snug truncate">
                        {name}
                      </h4>
                      <p className="text-slate-200 text-[10px] sm:text-[11px] leading-tight line-clamp-2">
                        {hint}
                      </p>
                    </div>
                    <div
                      className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md border shrink-0 ${iconBg}`}>
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}

export interface CardDetails {
  badgeIcon: LucideIcon;
  badge: string;
  note?: { icon: LucideIcon; text: string };
  chips: Array<{ icon?: LucideIcon; text: string }>;
  priceLabel: string;
  unit: string;
  cta: string;
}

export function LandingListingCard({
  listing,
  details,
  saved,
  onToggleSave,
  onSelect,
}: {
  listing: Listing;
  details: CardDetails;
  saved: boolean;
  onToggleSave: () => void;
  onSelect: () => void;
}) {
  const {
    badgeIcon: BadgeIcon,
    badge,
    note,
    chips,
    priceLabel,
    unit,
    cta,
  } = details;
  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col justify-between">
      <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden bg-slate-100 shrink-0">
        <img
          src={listing.image}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          onError={handleImageError}
        />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#006F3C]/90 backdrop-blur-md text-white text-[11px] font-bold shadow-md">
            <BadgeIcon className="w-3 h-3" />
            <span>{badge}</span>
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleSave();
            }}
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-red-500 transition-colors shadow-md pointer-events-auto">
            <Heart
              className={`w-4 h-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`}
            />
          </button>
        </div>
        {note && (
          <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 border border-white/20">
            <note.icon className="w-3 h-3 text-emerald-400" />
            <span>{note.text}</span>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs gap-2">
            <p className="text-slate-500 font-medium flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#006F3C] shrink-0" />
              <span className="truncate">{listing.location}</span>
            </p>
            {listing.reviewsCount > 0 ? (
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                <span className="font-bold text-amber-900 text-xs">
                  {listing.rating}
                </span>
                <span className="text-slate-400 text-[10px]">
                  ({listing.reviewsCount})
                </span>
              </div>
            ) : (
              <span className="text-xs font-medium text-[#006F3C] shrink-0">
                New
              </span>
            )}
          </div>
          <h4 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-[#006F3C] transition-colors leading-snug line-clamp-1 break-words">
            {listing.title}
          </h4>
          <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {chips.map(({ icon: ChipIcon, text }) => (
              <span
                key={text}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold flex items-center gap-1 max-w-[160px]">
                {ChipIcon ? (
                  <ChipIcon className="w-3 h-3 text-[#006F3C] shrink-0" />
                ) : (
                  "✓"
                )}
                <span className="truncate">{text}</span>
              </span>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">{priceLabel}</p>
            <p className="text-sm sm:text-base font-bold text-slate-900">
              PKR {listing.price.toLocaleString()}{" "}
              <span className="text-xs font-normal text-slate-500">
                / {unit}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect();
            }}
            className="min-h-[42px] px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#006F3C] hover:bg-[#005C32] text-white text-xs font-semibold transition-all shadow-2xs group-hover:shadow-md flex items-center gap-1.5 shrink-0">
            <span>{cta}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Location filter bar + card grid + empty state. */
export function ListingGrid({
  filterLabel,
  locations,
  location,
  onLocation,
  countText,
  listings,
  details,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyHint,
  onReset,
  wishlist,
  onSelectListing,
}: {
  filterLabel: string;
  locations: string[];
  location: string;
  onLocation: (location: string) => void;
  countText: string;
  listings: Listing[];
  details: (listing: Listing) => CardDetails;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyHint: string;
  onReset: () => void;
  wishlist: {
    isSaved: (id: string) => boolean;
    toggle: (id: string) => Promise<void>;
  };
  onSelectListing: (listing: Listing) => void;
}) {
  return (
    <section className="space-y-6 pt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-sm font-medium text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#006F3C]" /> {filterLabel}:
          </span>
          {locations.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onLocation(item)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${location === item ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}>
              {item}
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold text-slate-500 shrink-0">
          Showing{" "}
          <span className="font-bold text-slate-900">{listings.length}</span>{" "}
          {countText}
        </p>
      </div>

      {listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {listings.map((listing) => (
            <LandingListingCard
              key={listing.id}
              listing={listing}
              details={details(listing)}
              saved={wishlist.isSaved(listing.id)}
              onToggleSave={() => void wishlist.toggle(listing.id)}
              onSelect={() => onSelectListing(listing)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <EmptyIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-800 text-base">{emptyTitle}</h4>
          <p className="text-xs text-slate-500">{emptyHint}</p>
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-xl bg-[#006F3C] hover:bg-[#005C32] text-white text-xs font-bold">
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
}

/** Narrows listings by a location chip ('All' keeps everything) and an optional spec field matched against the selected category. */
export function filterListings(
  listings: Listing[],
  location: string,
  category: string,
  specValue?: (listing: Listing) => string | undefined,
) {
  return listings.filter((item) => {
    if (category !== "All" && specValue) {
      const value = specValue(item);
      if (value && !value.toLowerCase().includes(category.toLowerCase()))
        return false;
    }
    return (
      location === "All" ||
      item.location.toLowerCase().includes(location.toLowerCase())
    );
  });
}
