import { useEffect, useState, type ReactNode } from "react";
import { Check, Image as ImageIcon, LoaderCircle, Plus } from "lucide-react";
import {
  api,
  EXPERIENCE_TYPES,
  type LatLng,
  type VendorListing,
} from "../../shared/api/api";
import { AddressFields, LocationPinField } from "../../shared/components/MapPin";
import { useReasonDialog } from "../../shared/components/ReasonDialog";
import ChipInput from "./ChipInput";
import { defaultExtras, ExtrasFields, extrasInput, extrasLines, extrasProblem, FacilityChecklist, type Extras } from "./PropertyExtrasFields";
import HomestayHostFields, {
  homestayDraft,
  homestayInput,
} from "./HomestayHostFields";
import PhotoManager, { toPhotoInput, type EditablePhoto } from "./PhotoManager";
import StayInfoFields, {
  defaultStayInfo,
  stayInfoProblem,
} from "./StayInfoFields";
import { openSeason, PAYMENT_LABELS } from "../../shared/utils/stayInfo";
import { addressLine, HOME_TYPES, HOTEL_TYPES, roomFacts, type PropertyAddress } from "../../shared/utils/rooms";
import {
  emptyRoom,
  entireHome,
  newRoom,
  primaryButton,
  RoomForm,
  secondaryButton,
} from "./RoomManager";
import type { VendorRoomInput } from "../../shared/api/api";
import Select, { TimeInput } from '../../shared/components/Select';

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15";
const choiceClass = (selected: boolean) =>
  `flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${selected ? "border-[#006F3C] bg-emerald-50" : "border-slate-200 bg-white hover:border-slate-300"}`;

type StepId =
  | "type" | "stay" | "count" | "confirm" | "name"
  | "address" | "pin"
  | "facilities" | "extras" | "rules" | "policies" | "host"
  | "rooms" | "photos"
  | "review" | "business";

const SECTIONS = ["Property", "Location", "Details", "Rooms", "Photos", "Finish"] as const;
type Section = typeof SECTIONS[number];

/** One small question per step. The section groups steps in the progress bar. */
const STEP_TEXT: Record<StepId, { section: Section; title: string; intro: string }> = {
  type: { section: "Property", title: "Which best describes your place?", intro: "Guests filter by this, so pick the closest match." },
  stay: { section: "Property", title: "What can guests book?", intro: "This decides whether guests book the whole place or a room in it." },
  count: { section: "Property", title: "How many are you listing?", intro: "Each property is listed on its own." },
  confirm: { section: "Property", title: "Does this sound like your property?", intro: "" },
  name: { section: "Property", title: "What is your property called?", intro: "The name and description appear on the property page and in search." },
  address: { section: "Location", title: "Where is your property?", intro: "Write the address the way a driver would find it: area, village or road, and town." },
  pin: { section: "Location", title: "Pin it on the map", intro: "A map pin lets guests get directions. You can skip this and add it later." },
  facilities: { section: "Details", title: "What can guests use?", intro: "Tick everything guests can use at the property. Guests filter search results by these." },
  extras: { section: "Details", title: "Breakfast and parking", intro: "Most guests in Gilgit-Baltistan arrive by car or jeep, so tell them where to park." },
  rules: { section: "Details", title: "House rules and check-in", intro: "Check-in and check-out times are shown on every booking." },
  policies: { section: "Details", title: "Policies and mountain essentials", intro: "Guests check these before they book: how to pay, children and pets, and power, heating, signal and the road in." },
  host: { section: "Details", title: "Introduce the host and meals", intro: "Guests choose homestays for the people and the food." },
  rooms: { section: "Rooms", title: "What do guests book?", intro: "Add one category per kind of room, such as Deluxe Double or Family Room. We never sell more rooms than you set." },
  photos: { section: "Photos", title: "Show guests the place", intro: "Add up to 20 photos. The first is the cover in search results; captions help guests." },
  review: { section: "Finish", title: "Check everything", intro: "GBBookings checks new properties before guests can book them, usually within a day. You get an email either way." },
  business: { section: "Finish", title: "Your business details", intro: "Last step: who runs the property, and the documents GBBookings needs to verify you. Your listing is submitted with them." },
};

type DraftRoom = { input: VendorRoomInput; photos: EditablePhoto[] };

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={`text-sm font-semibold text-slate-700 ${wide ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
}

/**
 * Add a hotel or home one small step at a time; each step replaces the last on the same screen. Progress is saved on
 * the server on every step and reopens where the partner left off. The review step creates the listing (and submits
 * it). A new partner passes `registration`: the business details and documents come last, and submitting them
 * creates and submits the listing together with the application.
 */
export default function AddHotelWizard({
  kind = "hotel",
  registration,
  onDone,
  onExit,
}: {
  kind?: "hotel" | "homestay";
  /** Renders the business registration; it calls `onSubmitted` once the application is submitted. */
  registration?: (onSubmitted: () => void) => ReactNode;
  onDone: (listing: VendorListing, message: string) => void;
  onExit: () => void;
}) {
  const homestay = kind === "homestay";
  const [hotel, setHotel] = useState({
    title: "",
    hotelType: homestay ? "Homestay" : "Hotel",
    description: "",
    location: "",
    checkInTime: homestay ? "13:00" : "14:00",
    checkOutTime: "11:00",
    howMany: "one" as "one" | "several",
  });
  const [host, setHost] = useState(() => homestayDraft());
  const [pin, setPin] = useState<LatLng>();
  const [address, setAddress] = useState<PropertyAddress>({ line1: "", area: "", city: "", region: "Gilgit-Baltistan", postcode: "" });
  const [stayInfo, setStayInfo] = useState(defaultStayInfo);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [extras, setExtras] = useState<Extras>(() => defaultExtras(!homestay));
  const [policies, setPolicies] = useState<string[]>([]);
  const [photos, setPhotos] = useState<EditablePhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [rooms, setRooms] = useState<DraftRoom[]>([]);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const { askReason, dialog } = useReasonDialog();
  const singleUnit = homestay && host.stayType === "entire_home";
  const noun = hotel.hotelType.toLowerCase();

  const steps: StepId[] = [
    "type", ...(homestay ? ["stay" as const] : []), "count", "confirm", "name",
    "address", "pin",
    "facilities", "extras", "rules", "policies", ...(homestay ? ["host" as const] : []),
    "rooms", "photos", "review", ...(registration ? ["business" as const] : []),
  ];
  const id = steps[Math.min(step, steps.length - 1)];

  // Saved progress: loaded once, then saved on every step change and on exit.
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [savedAt, setSavedAt] = useState<string>();
  const [resumedFrom, setResumedFrom] = useState<string>();
  const snapshot = () => ({ hotel, address, extras, host, pin, stayInfo, amenities, facilities, policies, photos, rooms });
  useEffect(() => {
    let active = true;
    api.getListingDraft(kind).then((draft) => {
      if (!active || !draft) return;
      const data = draft.data as Partial<ReturnType<typeof snapshot>>;
      if (data.hotel) setHotel((value) => ({ ...value, ...data.hotel }));
      // Drafts saved before the address had parts keep their one line as the street.
      if (data.address) setAddress(data.address);
      else if (data.hotel?.location) setAddress((value) => ({ ...value, line1: data.hotel!.location }));
      if (data.host) setHost((value) => ({ ...value, ...data.host }));
      if (data.stayInfo) setStayInfo((value) => ({ ...value, ...data.stayInfo }));
      setPin(data.pin);
      setAmenities(data.amenities ?? []);
      setFacilities(data.facilities ?? []);
      if (data.extras) setExtras(data.extras);
      setPolicies(data.policies ?? []);
      setPhotos(data.photos ?? []);
      setRooms(data.rooms ?? []);
      setStep(Math.min(draft.step, steps.length - 1));
      setSavedAt(draft.updatedAt);
      setResumedFrom(draft.updatedAt);
    }).catch(() => undefined).finally(() => active && setLoadingDraft(false));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);
  const saveDraft = async (atStep: number) => {
    try {
      setSavedAt((await api.saveListingDraft(kind, atStep, snapshot())).updatedAt);
      return true;
    } catch {
      setError("Your progress could not be saved. Check your connection; your entries are still on this page.");
      return false;
    }
  };

  const problems: Partial<Record<StepId, string>> = {
    name: hotel.title.trim().length < 2 ? "Add the name of your property."
      : hotel.description.trim().length < 20 ? "Write a description of at least 20 characters." : "",
    address: address.line1.trim().length < 2 || address.city.trim().length < 2 ? "Add the street or village and the town." : "",
    policies: stayInfoProblem(stayInfo),
    extras: extrasProblem(extras),
    host: host.hostName.trim().length < 2 ? "Add the host name."
      : host.meals.some((meal) => meal.offered && !meal.included && meal.price <= 0) ? "Set a price for each extra meal, or mark it included." : "",
    rooms: rooms.length === 0 ? (singleUnit ? "Set up the place: bedrooms, beds and price." : "Add at least one room category.") : "",
    photos: photos.length === 0 ? "Add at least one photo." : "",
  };
  const firstProblem = (upTo: number) => steps.slice(0, upTo).map((stepId) => problems[stepId]).find(Boolean);
  const go = (next: number) => {
    const blocking = firstProblem(next);
    if (next > step && blocking) {
      setError(blocking);
      return;
    }
    setError("");
    setEditing(null);
    setStep(next);
    void saveDraft(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const exit = async () => {
    if (hotel.title || hotel.description || photos.length || rooms.length) {
      setBusy(true);
      const saved = await saveDraft(step);
      setBusy(false);
      if (!saved) return;
    }
    onExit();
  };
  const discard = async () => {
    if ((await askReason({ title: `Discard this ${noun}?`, destructive: true, confirmLabel: "Discard", description: "Your saved progress on every step will be deleted." })) === null) return;
    await api.deleteListingDraft(kind).catch(() => undefined);
    onExit();
  };
  const setStayType = (stayType: "rooms" | "entire_home") => {
    // Switching between whole place and rooms changes what a booking unit is, so start the rooms step over.
    if (stayType !== host.stayType) {
      setRooms([]);
      setEditing(null);
    }
    setHost({ ...host, stayType });
  };

  const finish = async (submit: boolean) => {
    const blocking = firstProblem(steps.length);
    if (blocking) {
      setError(blocking);
      return;
    }
    setBusy(true);
    setError("");
    let created: VendorListing | null = null;
    try {
      created = (await api.createHotelListing({
        type: kind,
        title: hotel.title.trim(),
        location: addressLine(address),
        address: { line1: address.line1.trim(), city: address.city.trim(), ...Object.fromEntries((["area", "region", "postcode"] as const).flatMap((key) => (address[key]?.trim() ? [[key, address[key]!.trim()]] : []))) },
        description: hotel.description.trim(),
        price: Math.min(...rooms.map((room) => room.input.basePrice)),
        imageIds: photos.flatMap((photo) => (photo.mediaId ? [photo.mediaId] : [])),
        photos: toPhotoInput(photos),
        hotelSpecs: { hotelType: hotel.hotelType, amenities, facilities, policies, checkInTime: hotel.checkInTime, checkOutTime: hotel.checkOutTime, ...extrasInput(extras) },
        ...(homestay ? { homestaySpecs: homestayInput(host) } : {}),
        ...(pin ? { coordinates: pin } : {}),
        stayInfo,
      })).data;
      for (const room of rooms) await api.addHotelRoom(created.id, { ...emptyRoom, ...room.input, ...(singleUnit ? { totalRooms: 1 } : {}) });
      if (submit) created = (await api.submitHotelListing(created.id)).data;
      onDone(created, submit
        ? `${created.title} was submitted. You will get an email once GBBookings has checked it.`
        : `${created.title} is saved as a draft. Submit it from its Rooms tab when ready.`);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : `The ${noun} could not be saved.`;
      // The listing exists even if a room failed; send the partner to finish it in the workspace.
      if (created) onDone(created, `${created.title} was saved as a draft, but not everything went through: ${message} Finish it below.`);
      else setError(message);
    } finally {
      setBusy(false);
    }
  };

  const fromPrice = rooms.length ? Math.min(...rooms.map((room) => room.input.basePrice)) : null;
  const offeredMeals = host.meals.filter((meal) => meal.offered);
  const listingWhat = `${hotel.howMany === "one" ? `one ${noun}` : `several ${noun}s, one at a time`} where guests book ${singleUnit ? "the entire place" : "a room"}`;
  const reviewRows: Array<[string, string, StepId]> = [
    ["Property", `${hotel.title || "—"} · ${hotel.hotelType}${homestay ? ` · ${host.experienceType} · ${singleUnit ? "Entire place" : "Private rooms"}` : ""}`, "name"],
    ["Address", `${addressLine(address) || "—"}${pin ? " · map pin set" : " · no map pin"}`, "address"],
    ["Facilities", [...amenities, ...facilities].join(", ") || "None added", "facilities"],
    [homestay ? "Parking" : "Breakfast & parking", extrasLines(extrasInput(extras)).join(" · "), "extras"],
    ["House rules", `Check-in from ${hotel.checkInTime}, check-out by ${hotel.checkOutTime}${policies.length ? ` · ${policies.join(", ")}` : ""}`, "rules"],
    ["Policies & essentials", `Pay by ${stayInfo.paymentMethods.map((method) => PAYMENT_LABELS[method]).join(", ") || "—"} · children ${stayInfo.childrenAllowed ? "welcome" : "not allowed"} · ${openSeason(stayInfo.openMonths)}`, "policies"],
    ...(homestay ? [["Host & meals", `${host.hostName || "—"}${host.languages.length ? ` · ${host.languages.join(", ")}` : ""} · ${offeredMeals.length ? offeredMeals.map((meal) => `${meal.type} ${meal.included ? "included" : `PKR ${meal.price}`}`).join(", ") : "no meals"}`, "host"] as [string, string, StepId]] : []),
    ["Rooms", rooms.map((room) => singleUnit
      ? [room.input.bedType, ...roomFacts(room.input), `up to ${room.input.maxAdults + room.input.maxChildren} guests`].join(", ")
      : `${room.input.name} (${room.input.totalRooms})`).join(", ") || "None yet", "rooms"],
    ["Photos", `${photos.length} photo${photos.length === 1 ? "" : "s"}`, "photos"],
  ];

  if (loadingDraft)
    return <div className="flex min-h-64 items-center justify-center" role="status"><LoaderCircle className="size-7 animate-spin text-[#006F3C]" /><span className="sr-only">Loading your saved progress</span></div>;

  const section = STEP_TEXT[id].section;
  const sectionIndex = SECTIONS.indexOf(section);
  const last = id === "review" || id === "business";

  return (
    <div className="flex flex-wrap items-start gap-7">
      {dialog}
      <div className="min-w-0 flex-[999_1_520px] space-y-5">
        {/* Progress: sections done, the current one, and how far through the whole flow. */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold" aria-label="Sections">
              {SECTIONS.filter((name) => steps.some((stepId) => STEP_TEXT[stepId].section === name)).map((name) => {
                const index = SECTIONS.indexOf(name);
                return <li key={name} aria-current={name === section ? "step" : undefined} className={`flex items-center gap-1 ${index < sectionIndex ? "text-[#006F3C]" : index === sectionIndex ? "text-slate-900" : "text-slate-400"}`}>
                  {index < sectionIndex && <Check className="size-3.5" />}{name}
                </li>;
              })}
            </ol>
            <div className="flex shrink-0 gap-3 text-sm font-semibold">
              {savedAt && <button type="button" onClick={discard} disabled={busy} className="min-h-11 text-rose-700 hover:text-rose-900">Discard</button>}
              <button type="button" onClick={exit} disabled={busy} className="min-h-11 text-slate-600 hover:text-slate-900">Save and exit</button>
            </div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of ${steps.length}`}>
            <div className="h-full rounded-full bg-[#006F3C] transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
          <p className="text-xs text-slate-500">Step {step + 1} of {steps.length}{savedAt && ` · Saved ${new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}</p>
        </div>

        {resumedFrom && step > 0 && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">Welcome back. We kept everything you entered on {new Date(resumedFrom).toLocaleString()}, so you can carry on from here.</p>}

        <div>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{id === "extras" && homestay ? "Parking" : STEP_TEXT[id].title}</h2>
          {STEP_TEXT[id].intro && <p className="mt-1.5 text-sm leading-6 text-slate-500">{id === "rooms" && singleUnit ? "Guests book the whole place. Add its bedrooms and beds, how many people it sleeps and the price per night." : STEP_TEXT[id].intro}</p>}
        </div>
        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        {id === "type" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(homestay ? HOME_TYPES : HOTEL_TYPES).map((value) => (
              <label key={value} className={choiceClass(hotel.hotelType === value)}>
                <input type="radio" name="property-type" className="mt-1 size-4 accent-[#006F3C]" checked={hotel.hotelType === value} onChange={() => setHotel({ ...hotel, hotelType: value })} />
                <span className="text-sm font-bold">{value}</span>
              </label>
            ))}
          </div>
        )}

        {id === "stay" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {([["entire_home", "Entire place", "Guests have the whole place to themselves and don't share it with the host or other guests."],
              ["rooms", "Private rooms", "Guests book a room in the property; common areas are shared with the host or other guests."]] as const).map(([value, label, text]) => (
              <label key={value} className={choiceClass(host.stayType === value)}>
                <input type="radio" name="stay-type" checked={host.stayType === value} onChange={() => setStayType(value)} className="mt-1 size-4 accent-[#006F3C]" />
                <span><span className="block text-sm font-bold">{label}</span><span className="text-xs text-slate-500">{text}</span></span>
              </label>
            ))}
          </div>
        )}

        {id === "count" && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {([["one", `One ${noun}`], ["several", `Several ${noun}s`]] as const).map(([value, label]) => (
                <label key={value} className={choiceClass(hotel.howMany === value)}>
                  <input type="radio" name="how-many" checked={hotel.howMany === value} onChange={() => setHotel({ ...hotel, howMany: value })} className="mt-1 size-4 accent-[#006F3C]" />
                  <span className="text-sm font-bold">{label}</span>
                </label>
              ))}
            </div>
            {hotel.howMany === "several" && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">List the first one now. Afterwards, "Duplicate" in your dashboard copies it so the next one only needs its own name, address, photos and rooms.</p>}
          </div>
        )}

        {id === "confirm" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-slate-500">You're listing:</p>
            <p className="mt-2 text-xl font-extrabold first-letter:uppercase">{listingWhat}</p>
            <button type="button" onClick={() => go(0)} className={`${secondaryButton} mt-5`}>No, I need to make a change</button>
          </div>
        )}

        {id === "name" && (
          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
            <Field label="Property name" wide>
              <input className={inputClass} required maxLength={160} value={hotel.title} onChange={(e) => setHotel({ ...hotel, title: e.target.value })} placeholder={homestay ? "Karimabad Family Home" : "Shigar Riverside Lodge"} />
            </Field>
            {homestay && (
              <Field label="Experience">
                <Select className={inputClass} value={host.experienceType} onChange={(e) => setHost({ ...host, experienceType: e.target.value as typeof host.experienceType })}>
                  {EXPERIENCE_TYPES.map((value) => <option key={value}>{value}</option>)}
                </Select>
              </Field>
            )}
            <Field label="Description" wide>
              <textarea className={`${inputClass} min-h-36 py-3`} maxLength={10000} value={hotel.description} onChange={(e) => setHotel({ ...hotel, description: e.target.value })}
                placeholder={homestay ? "Your home, the village, what guests can do with your family: farm walks, cooking, local festivals." : "What makes the stay special: views, food, how far the main sights are."} />
              <span className="mt-1 block text-xs font-normal text-slate-500">{hotel.description.trim().length}/20 characters minimum</span>
            </Field>
            <Field label="Tourism department registration number (if you have one)" wide>
              <input className={inputClass} maxLength={60} value={extras.licenceNumber ?? ""} onChange={(e) => setExtras({ ...extras, licenceNumber: e.target.value })} placeholder="e.g. GB Tourism Department registration" />
            </Field>
          </div>
        )}

        {id === "address" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <AddressFields value={address} onChange={setAddress} onPin={setPin} />
          </div>
        )}

        {id === "pin" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <LocationPinField value={pin} onChange={setPin} location={addressLine(address)} />
          </div>
        )}

        {id === "facilities" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            {/* One checklist; facilities typed into older drafts are folded in. */}
            <FacilityChecklist value={[...new Set([...amenities, ...facilities])]} onChange={(value) => { setAmenities(value); setFacilities([]); }} />
          </div>
        )}

        {id === "extras" && <div className="rounded-2xl border border-slate-200 bg-white p-5"><ExtrasFields value={extras} onChange={setExtras} /></div>}

        {id === "rules" && (
          <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
            <Field label="Check-in from"><TimeInput className={inputClass} value={hotel.checkInTime} onChange={(e) => setHotel({ ...hotel, checkInTime: e.target.value })} /></Field>
            <Field label="Check-out by"><TimeInput className={inputClass} value={hotel.checkOutTime} onChange={(e) => setHotel({ ...hotel, checkOutTime: e.target.value })} /></Field>
            <div className="sm:col-span-2">
              <ChipInput label="House rules" value={policies} onChange={setPolicies}
                suggestions={homestay ? ["No smoking indoors", "No alcohol", "Modest dress in the village", "Families and couples only", "Quiet hours after 10 pm", "ID required at check-in"] : ["No smoking indoors", "No pets", "ID required at check-in", "Quiet hours after 10 pm"]} />
            </div>
          </div>
        )}

        {id === "policies" && <div className="rounded-2xl border border-slate-200 bg-white p-5"><StayInfoFields value={stayInfo} onChange={setStayInfo} /></div>}

        {id === "host" && <div className="rounded-2xl border border-slate-200 bg-white p-5"><HomestayHostFields value={host} onChange={setHost} onUploadingChange={setUploading} /></div>}

        {id === "rooms" && (
          <div className="space-y-3">
            {rooms.map((room, index) => editing === index ? (
              <RoomForm key={index} initial={{ ...room.input, photos: room.photos }} singleUnit={singleUnit} live={false} busy={false} submitLabel="Save" onCancel={() => setEditing(null)}
                onSubmit={(input, roomPhotos) => { setRooms(rooms.map((item, at) => (at === index ? { input, photos: roomPhotos } : item))); setEditing(null); }} />
            ) : (
              <article key={index} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                {room.photos[0] ? <img src={room.photos[0].url} alt="" className="h-16 w-22 rounded-lg object-cover" />
                  : <span className="flex h-16 w-22 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><ImageIcon className="size-5" /></span>}
                <div className="min-w-45 flex-1">
                  <p className="font-extrabold">{room.input.name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {singleUnit ? "" : `${room.input.totalRooms} room${room.input.totalRooms === 1 ? "" : "s"} · `}
                    {[room.input.bedType, ...roomFacts(room.input)].join(" · ")} · {room.input.maxAdults} adults, {room.input.maxChildren} children · PKR {room.input.basePrice.toLocaleString()}/night
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={secondaryButton} onClick={() => setEditing(index)}>Edit</button>
                  <button type="button" className={secondaryButton} onClick={() => setRooms(rooms.filter((_, at) => at !== index))}>Remove</button>
                </div>
              </article>
            ))}
            {editing === "new" ? (
              <RoomForm initial={singleUnit ? entireHome : newRoom} singleUnit={singleUnit} live={false} busy={false} submitLabel={singleUnit ? "Save" : "Add this room"} onCancel={() => setEditing(null)}
                onSubmit={(input, roomPhotos) => { setRooms([...rooms, { input, photos: roomPhotos }]); setEditing(null); setError(""); }} />
            ) : !(singleUnit && rooms.length) && (
              <button type="button" className={`${secondaryButton} w-full border-dashed`} onClick={() => setEditing("new")}>
                <Plus className="size-4" />{singleUnit ? "Set up the place" : rooms.length ? "Add another room category" : "Add a room category"}
              </button>
            )}
          </div>
        )}

        {id === "photos" && <div className="rounded-2xl border border-slate-200 bg-white p-5"><PhotoManager photos={photos} onChange={setPhotos} max={20} label="Property photos" onUploadingChange={setUploading} /></div>}

        {id === "review" && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            {reviewRows.map(([name, value, target]) => (
              <div key={name} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="min-w-0"><p className="text-sm font-bold">{name}</p><p className="text-sm text-slate-600">{value}</p></div>
                <button type="button" className="min-h-11 text-sm font-bold text-[#006F3C]" onClick={() => go(steps.indexOf(target))}>Edit</button>
              </div>
            ))}
          </div>
        )}

        {id === "business" && registration?.(() => void finish(true))}

        <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5">
          {step > 0 ? <button type="button" className={secondaryButton} onClick={() => go(step - 1)}>Back</button> : <span />}
          {!last ? (
            <button type="button" className={primaryButton} disabled={uploading || editing !== null} onClick={() => go(step + 1)}>Continue</button>
          ) : id === "review" && registration ? (
            <button type="button" className={primaryButton} onClick={() => go(step + 1)}>Continue to your business details</button>
          ) : id === "review" ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={secondaryButton} disabled={busy} onClick={() => finish(false)}>Save as draft</button>
              <button type="button" className={primaryButton} disabled={busy} onClick={() => finish(true)}>{busy && <LoaderCircle className="size-4 animate-spin" />}Submit for review</button>
            </div>
          ) : busy && <p className="flex items-center gap-2 text-sm text-slate-600"><LoaderCircle className="size-4 animate-spin" />Submitting your {noun}…</p>}
        </div>
      </div>

      <aside aria-label="Guest preview" className="hidden w-80 shrink-0 space-y-2.5 xl:block">
        <p className="text-xs font-bold tracking-[0.12em] text-slate-500">HOW GUESTS WILL SEE IT</p>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {photos[0] ? <img src={photos[0].url} alt={photos[0].caption || "Cover photo"} className="h-44 w-full object-cover" />
            : <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-500">Cover photo</div>}
          <div className="space-y-2.5 p-4">
            <div>
              <p className="text-[17px] font-extrabold">{hotel.title || "Your property name"}</p>
              <p className="mt-0.5 text-sm text-slate-500">{singleUnit ? `Entire ${noun}` : hotel.hotelType} · {addressLine(address) || "Address"}</p>
            </div>
            {homestay && host.hostName && <p className="text-sm text-slate-600">Hosted by <strong>{host.hostName}</strong></p>}
            {fromPrice !== null && <p className="text-sm"><span className="text-slate-500">from</span> <strong>PKR {fromPrice.toLocaleString()}</strong> <span className="text-slate-500">/ night</span></p>}
            {rooms.length > 0 && !singleUnit && (
              <ul className="divide-y divide-slate-100 border-t border-slate-100 text-sm">
                {rooms.map((room, index) => <li key={index} className="flex justify-between gap-3 py-2"><span className="truncate">{room.input.name}</span><strong>{room.input.basePrice.toLocaleString()}</strong></li>)}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
