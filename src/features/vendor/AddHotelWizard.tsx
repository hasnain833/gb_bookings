import { useState, type ReactNode } from "react";
import { Check, Image as ImageIcon, LoaderCircle, Plus } from "lucide-react";
import {
  api,
  EXPERIENCE_TYPES,
  type LatLng,
  type VendorListing,
  type VendorRoomInput,
} from "../../shared/api/api";
import { LocationPinField } from "../../shared/components/MapPin";
import { useReasonDialog } from "../../shared/components/ReasonDialog";
import ChipInput from "./ChipInput";
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
import {
  emptyRoom,
  entireHome,
  primaryButton,
  RoomForm,
  secondaryButton,
} from "./RoomManager";

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-[15px] outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15";

type StepId =
  | "basics"
  | "location"
  | "policies"
  | "host"
  | "photos"
  | "rooms"
  | "review";
const STEP_TEXT: Record<
  StepId,
  { name: string; hint: string; title: string; intro: string }
> = {
  basics: {
    name: "Basics",
    hint: "Name, type, description",
    title: "Tell guests about your place",
    intro:
      "The name and description appear on the property page and in search.",
  },
  location: {
    name: "Location & rules",
    hint: "Address, map, check-in, rules",
    title: "Where is it, and what are the rules?",
    intro:
      "A map pin helps guests find you. Check-in and check-out times are shown on every booking.",
  },
  policies: {
    name: "Policies & essentials",
    hint: "Payment, children, heating, road",
    title: "Policies and mountain essentials",
    intro:
      "Guests check these before they book: how to pay, children and pets, and what to expect for power, heating, signal and the road in.",
  },
  host: {
    name: "Host & meals",
    hint: "Who welcomes guests, food",
    title: "Introduce the host and meals",
    intro:
      "Guests choose homestays for the people and the food. Tell them who will host them and what meals you offer.",
  },
  photos: {
    name: "Photos",
    hint: "Cover and gallery",
    title: "Show guests the place",
    intro:
      "Add up to 20 photos. The first is the cover in search results; captions help guests.",
  },
  rooms: {
    name: "Rooms",
    hint: "Categories, prices, stock",
    title: "What do guests book?",
    intro:
      "Add one category per kind of room, such as Deluxe Double or Family Room. We never sell more rooms than you set.",
  },
  review: {
    name: "Review & submit",
    hint: "Checked by GBBookings",
    title: "Check everything, then submit",
    intro:
      "GBBookings checks new properties before guests can book them, usually within a day. You get an email either way.",
  },
};

type DraftRoom = { input: VendorRoomInput; photos: EditablePhoto[] };

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label
      className={`text-sm font-semibold text-slate-700 ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      {children}
    </label>
  );
}

/** Add a hotel or homestay step by step; nothing is saved until the last step creates the draft (and optionally submits it). */
export default function AddHotelWizard({
  kind = "hotel",
  onDone,
  onExit,
}: {
  kind?: "hotel" | "homestay";
  onDone: (listing: VendorListing, message: string) => void;
  onExit: () => void;
}) {
  const homestay = kind === "homestay";
  const steps: StepId[] = homestay
    ? ["basics", "location", "policies", "host", "photos", "rooms", "review"]
    : ["basics", "location", "policies", "photos", "rooms", "review"];
  const noun = homestay ? "homestay" : "hotel";
  const [step, setStep] = useState(0);
  const [hotel, setHotel] = useState({
    title: "",
    hotelType: homestay ? "Homestay" : "Hotel",
    description: "",
    location: "",
    checkInTime: homestay ? "13:00" : "14:00",
    checkOutTime: "11:00",
  });
  const [host, setHost] = useState(() => homestayDraft());
  const [pin, setPin] = useState<LatLng>();
  const [stayInfo, setStayInfo] = useState(defaultStayInfo);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [policies, setPolicies] = useState<string[]>([]);
  const [photos, setPhotos] = useState<EditablePhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [rooms, setRooms] = useState<DraftRoom[]>([]);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { askReason, dialog } = useReasonDialog();
  const singleUnit = homestay && host.stayType === "entire_home";
  const id = steps[step];

  const problems: Record<StepId, string> = {
    basics:
      hotel.title.trim().length < 2
        ? `Add the ${noun} name.`
        : hotel.description.trim().length < 20
          ? "Write a description of at least 20 characters."
          : "",
    location: hotel.location.trim().length < 2 ? "Add the location." : "",
    policies: stayInfoProblem(stayInfo),
    host:
      host.hostName.trim().length < 2
        ? "Add the host name."
        : host.meals.some(
              (meal) => meal.offered && !meal.included && meal.price <= 0,
            )
          ? "Set a price for each extra meal, or mark it included."
          : "",
    photos: photos.length === 0 ? "Add at least one photo." : "",
    rooms:
      rooms.length === 0
        ? singleUnit
          ? "Set up the home: guests, beds and price."
          : "Add at least one room category."
        : "",
    review: "",
  };
  const firstProblem = (upTo: number) =>
    steps
      .slice(0, upTo)
      .map((stepId) => problems[stepId])
      .find(Boolean);
  const go = (next: number) => {
    const blocking = firstProblem(next);
    if (next > step && blocking) {
      setError(blocking);
      return;
    }
    setError("");
    setEditing(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const exit = async () => {
    const dirty =
      hotel.title || hotel.description || photos.length || rooms.length;
    if (
      dirty &&
      (await askReason({
        title: "Leave without saving?",
        destructive: true,
        confirmLabel: `Discard ${noun}`,
        description:
          "Nothing has been saved yet. Your entries on these steps will be lost.",
      })) === null
    )
      return;
    onExit();
  };
  const setStayType = (stayType: "rooms" | "entire_home") => {
    // Switching between whole-home and rooms changes what a booking unit is, so start the rooms step over.
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
      created = (
        await api.createHotelListing({
          type: kind,
          title: hotel.title.trim(),
          location: hotel.location.trim(),
          description: hotel.description.trim(),
          price: Math.min(...rooms.map((room) => room.input.basePrice)),
          imageIds: photos.flatMap((photo) =>
            photo.mediaId ? [photo.mediaId] : [],
          ),
          photos: toPhotoInput(photos),
          hotelSpecs: {
            hotelType:
              hotel.hotelType.trim() || (homestay ? "Homestay" : "Hotel"),
            amenities,
            facilities,
            policies,
            checkInTime: hotel.checkInTime,
            checkOutTime: hotel.checkOutTime,
          },
          ...(homestay ? { homestaySpecs: homestayInput(host) } : {}),
          ...(pin ? { coordinates: pin } : {}),
          stayInfo,
        })
      ).data;
      for (const room of rooms)
        await api.addHotelRoom(created.id, {
          ...emptyRoom,
          ...room.input,
          ...(singleUnit ? { totalRooms: 1 } : {}),
        });
      if (submit) created = (await api.submitHotelListing(created.id)).data;
      onDone(
        created,
        submit
          ? `${created.title} was submitted. You will get an email once GBBookings has checked it.`
          : `${created.title} is saved as a draft. Submit it from its Rooms tab when ready.`,
      );
    } catch (reason) {
      const message =
        reason instanceof Error
          ? reason.message
          : `The ${noun} could not be saved.`;
      // The draft exists even if a room failed; send the partner to finish it in the workspace.
      if (created)
        onDone(
          created,
          `${created.title} was saved as a draft, but not everything went through: ${message} Finish it below.`,
        );
      else setError(message);
    } finally {
      setBusy(false);
    }
  };

  const fromPrice = rooms.length
    ? Math.min(...rooms.map((room) => room.input.basePrice))
    : null;
  const offeredMeals = host.meals.filter((meal) => meal.offered);
  const reviewRows: Array<[string, string, StepId]> = [
    [
      "Basics",
      `${hotel.title || "—"} · ${homestay ? `${host.experienceType} · ${singleUnit ? "Entire home" : "Private rooms"}` : hotel.hotelType}`,
      "basics",
    ],
    [
      "Location",
      `${hotel.location || "—"}${pin ? " · map pin set" : " · no map pin"} · check-in ${hotel.checkInTime}, check-out ${hotel.checkOutTime}`,
      "location",
    ],
    [
      "Amenities & rules",
      [...amenities, ...facilities, ...policies].join(", ") || "None added",
      "location",
    ],
    [
      "Policies & essentials",
      `Pay by ${stayInfo.paymentMethods.map((method) => PAYMENT_LABELS[method]).join(", ") || "—"} · children ${stayInfo.childrenAllowed ? "welcome" : "not allowed"} · ${openSeason(stayInfo.openMonths)}`,
      "policies",
    ],
    ...(homestay
      ? [
          [
            "Host & meals",
            `${host.hostName || "—"}${host.languages.length ? ` · ${host.languages.join(", ")}` : ""} · ${offeredMeals.length ? offeredMeals.map((meal) => `${meal.type} ${meal.included ? "included" : `PKR ${meal.price}`}`).join(", ") : "no meals"}`,
            "host",
          ] as [string, string, StepId],
        ]
      : []),
    [
      "Photos",
      `${photos.length} photo${photos.length === 1 ? "" : "s"}${photos.filter((photo) => photo.caption?.trim()).length ? `, ${photos.filter((photo) => photo.caption?.trim()).length} with captions` : ""}`,
      "photos",
    ],
    [
      "Rooms",
      rooms
        .map((room) =>
          singleUnit
            ? `${room.input.bedType}, up to ${room.input.maxAdults + room.input.maxChildren} guests`
            : `${room.input.name} (${room.input.totalRooms})`,
        )
        .join(", ") || "None yet",
      "rooms",
    ],
  ];

  return (
    <div className="flex flex-wrap items-start gap-7">
      {dialog}
      <nav
        aria-label="Steps"
        className="flex w-full flex-col gap-1 lg:w-60 lg:shrink-0">
        {steps.map((stepId, index) => {
          const done = index < step && !problems[stepId];
          return (
            <button
              key={stepId}
              type="button"
              onClick={() => go(index)}
              aria-current={index === step ? "step" : undefined}
              className={`flex min-h-14 items-start gap-3 rounded-xl px-2.5 py-2.5 text-left ${index === step ? "border border-emerald-200 bg-white" : "hover:bg-white/60"}`}>
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${done ? "bg-[#006F3C] text-white" : index === step ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"}`}>
                {done ? <Check className="size-4" /> : index + 1}
              </span>
              <span>
                <span
                  className={`block text-sm font-bold ${index > step ? "text-slate-500" : "text-slate-900"}`}>
                  {STEP_TEXT[stepId].name}
                </span>
                <span className="text-xs text-slate-500">
                  {STEP_TEXT[stepId].hint}
                </span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={exit}
          className="mt-3 min-h-11 rounded-lg px-2.5 text-left text-sm font-semibold text-slate-500 hover:text-slate-800">
          Cancel and exit
        </button>
      </nav>

      <div className="min-w-0 flex-[999_1_480px] space-y-5">
        <div>
          <p className="text-sm font-bold text-[#006F3C]">
            Step {step + 1} of {steps.length}
          </p>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {STEP_TEXT[id].title}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            {id === "rooms" && singleUnit
              ? "Guests book the whole home. Set how many people it sleeps and the price per night."
              : STEP_TEXT[id].intro}
          </p>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}

        {id === "basics" && (
          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
            <Field label={homestay ? "Homestay name" : "Hotel name"}>
              <input
                className={inputClass}
                required
                maxLength={160}
                value={hotel.title}
                onChange={(e) => setHotel({ ...hotel, title: e.target.value })}
                placeholder={
                  homestay ? "Karimabad Family Home" : "Shigar Riverside Lodge"
                }
              />
            </Field>
            {homestay ? (
              <Field label="Experience">
                <select
                  className={inputClass}
                  value={host.experienceType}
                  onChange={(e) =>
                    setHost({
                      ...host,
                      experienceType: e.target
                        .value as typeof host.experienceType,
                    })
                  }>
                  {EXPERIENCE_TYPES.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
            ) : (
              <>
                <Field label="Type of property">
                  <input
                    className={inputClass}
                    list="hotel-types"
                    maxLength={80}
                    value={hotel.hotelType}
                    onChange={(e) =>
                      setHotel({ ...hotel, hotelType: e.target.value })
                    }
                  />
                </Field>
                <datalist id="hotel-types">
                  <option value="Hotel" />
                  <option value="Guest House" />
                  <option value="Resort" />
                  <option value="Boutique Hotel" />
                  <option value="Lodge" />
                  <option value="Motel" />
                </datalist>
              </>
            )}
            {homestay && (
              <fieldset className="sm:col-span-2">
                <legend className="text-sm font-semibold text-slate-700">
                  What do guests book?
                </legend>
                <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      [
                        "rooms",
                        "Private rooms",
                        "Guests book rooms in your home; you may host several groups at once.",
                      ],
                      [
                        "entire_home",
                        "Entire home",
                        "One booking takes the whole house, cottage or chalet.",
                      ],
                    ] as const
                  ).map(([value, label, text]) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${host.stayType === value ? "border-[#006F3C] bg-emerald-50" : "border-slate-200"}`}>
                      <input
                        type="radio"
                        name="stay-type"
                        checked={host.stayType === value}
                        onChange={() => setStayType(value)}
                        className="mt-1 size-4 accent-[#006F3C]"
                      />
                      <span>
                        <span className="block text-sm font-bold">{label}</span>
                        <span className="text-xs text-slate-500">{text}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <Field label="Description" wide>
              <textarea
                className={`${inputClass} min-h-36 py-3`}
                maxLength={10000}
                value={hotel.description}
                onChange={(e) =>
                  setHotel({ ...hotel, description: e.target.value })
                }
                placeholder={
                  homestay
                    ? "Your home, the village, what guests can do with your family: farm walks, cooking, local festivals."
                    : "What makes the stay special: views, food, how far the main sights are."
                }
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                {hotel.description.trim().length}/20 characters minimum
              </span>
            </Field>
          </div>
        )}

        {id === "location" && (
          <div className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
            <Field label="Location" wide>
              <input
                className={inputClass}
                maxLength={240}
                value={hotel.location}
                onChange={(e) =>
                  setHotel({ ...hotel, location: e.target.value })
                }
                placeholder={
                  homestay
                    ? "Altit village, Karimabad, Hunza"
                    : "Main Bazaar, Shigar, Skardu"
                }
              />
            </Field>
            <div className="sm:col-span-2">
              <LocationPinField
                value={pin}
                onChange={setPin}
                location={hotel.location}
              />
            </div>
            <Field label="Check-in from">
              <input
                type="time"
                className={inputClass}
                value={hotel.checkInTime}
                onChange={(e) =>
                  setHotel({ ...hotel, checkInTime: e.target.value })
                }
              />
            </Field>
            <Field label="Check-out by">
              <input
                type="time"
                className={inputClass}
                value={hotel.checkOutTime}
                onChange={(e) =>
                  setHotel({ ...hotel, checkOutTime: e.target.value })
                }
              />
            </Field>
            <div className="sm:col-span-2">
              <ChipInput
                label="Amenities"
                value={amenities}
                onChange={setAmenities}
                suggestions={
                  homestay
                    ? [
                        "WiFi",
                        "Heating",
                        "Hot water",
                        "Parking",
                        "Garden",
                        "Mountain view",
                        "Kitchen access",
                        "Bonfire",
                      ]
                    : [
                        "WiFi",
                        "Breakfast",
                        "Parking",
                        "Heating",
                        "Restaurant",
                        "Mountain view",
                        "Room service",
                        "Airport pickup",
                      ]
                }
              />
            </div>
            {!homestay && (
              <div className="sm:col-span-2">
                <ChipInput
                  label="Facilities"
                  value={facilities}
                  onChange={setFacilities}
                  suggestions={[
                    "Garden",
                    "Generator backup",
                    "Laundry",
                    "Conference room",
                    "Prayer area",
                    "Family hall",
                  ]}
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <ChipInput
                label="House rules"
                value={policies}
                onChange={setPolicies}
                suggestions={
                  homestay
                    ? [
                        "No smoking indoors",
                        "No alcohol",
                        "Modest dress in the village",
                        "Families and couples only",
                        "Quiet hours after 10 pm",
                        "ID required at check-in",
                      ]
                    : [
                        "No smoking indoors",
                        "No pets",
                        "ID required at check-in",
                        "Quiet hours after 10 pm",
                      ]
                }
              />
            </div>
          </div>
        )}

        {id === "policies" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <StayInfoFields value={stayInfo} onChange={setStayInfo} />
          </div>
        )}

        {id === "host" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <HomestayHostFields
              value={host}
              onChange={setHost}
              onUploadingChange={setUploading}
            />
          </div>
        )}

        {id === "photos" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <PhotoManager
              photos={photos}
              onChange={setPhotos}
              max={20}
              label="Property photos"
              onUploadingChange={setUploading}
            />
          </div>
        )}

        {id === "rooms" && (
          <div className="space-y-3">
            {rooms.map((room, index) =>
              editing === index ? (
                <RoomForm
                  key={index}
                  initial={{ ...room.input, photos: room.photos }}
                  singleUnit={singleUnit}
                  live={false}
                  busy={false}
                  submitLabel="Save"
                  onCancel={() => setEditing(null)}
                  onSubmit={(input, roomPhotos) => {
                    setRooms(
                      rooms.map((item, at) =>
                        at === index ? { input, photos: roomPhotos } : item,
                      ),
                    );
                    setEditing(null);
                  }}
                />
              ) : (
                <article
                  key={index}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  {room.photos[0] ? (
                    <img
                      src={room.photos[0].url}
                      alt=""
                      className="h-16 w-22 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-16 w-22 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <ImageIcon className="size-5" />
                    </span>
                  )}
                  <div className="min-w-45 flex-1">
                    <p className="font-extrabold">{room.input.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {singleUnit
                        ? ""
                        : `${room.input.totalRooms} room${room.input.totalRooms === 1 ? "" : "s"} · `}
                      {room.input.bedType} · {room.input.maxAdults} adults,{" "}
                      {room.input.maxChildren} children · PKR{" "}
                      {room.input.basePrice.toLocaleString()}/night
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={secondaryButton}
                      onClick={() => setEditing(index)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={secondaryButton}
                      onClick={() =>
                        setRooms(rooms.filter((_, at) => at !== index))
                      }>
                      Remove
                    </button>
                  </div>
                </article>
              ),
            )}
            {editing === "new" ? (
              <RoomForm
                initial={singleUnit ? entireHome : emptyRoom}
                singleUnit={singleUnit}
                live={false}
                busy={false}
                submitLabel={singleUnit ? "Save" : "Add this room"}
                onCancel={() => setEditing(null)}
                onSubmit={(input, roomPhotos) => {
                  setRooms([...rooms, { input, photos: roomPhotos }]);
                  setEditing(null);
                  setError("");
                }}
              />
            ) : (
              !(singleUnit && rooms.length) && (
                <button
                  type="button"
                  className={`${secondaryButton} w-full border-dashed`}
                  onClick={() => setEditing("new")}>
                  <Plus className="size-4" />
                  {singleUnit
                    ? "Set up the home"
                    : rooms.length
                      ? "Add another room category"
                      : "Add a room category"}
                </button>
              )
            )}
          </div>
        )}

        {id === "review" && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
            {reviewRows.map(([name, value, target]) => (
              <div
                key={name}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-bold">{name}</p>
                  <p className="text-sm text-slate-600">{value}</p>
                </div>
                <button
                  type="button"
                  className="min-h-11 text-sm font-bold text-[#006F3C]"
                  onClick={() => go(steps.indexOf(target))}>
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-5">
          {step > 0 ? (
            <button
              type="button"
              className={secondaryButton}
              onClick={() => go(step - 1)}>
              Back
            </button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <button
              type="button"
              className={primaryButton}
              disabled={uploading || editing !== null}
              onClick={() => go(step + 1)}>
              Continue
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={secondaryButton}
                disabled={busy}
                onClick={() => finish(false)}>
                Save as draft
              </button>
              <button
                type="button"
                className={primaryButton}
                disabled={busy}
                onClick={() => finish(true)}>
                {busy && <LoaderCircle className="size-4 animate-spin" />}Submit
                for review
              </button>
            </div>
          )}
        </div>
      </div>

      <aside
        aria-label="Guest preview"
        className="w-full space-y-2.5 xl:w-80 xl:shrink-0">
        <p className="text-xs font-bold tracking-[0.12em] text-slate-500">
          HOW GUESTS WILL SEE IT
        </p>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {photos[0] ? (
            <img
              src={photos[0].url}
              alt={photos[0].caption || "Cover photo"}
              className="h-44 w-full object-cover"
            />
          ) : (
            <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-500">
              Cover photo
            </div>
          )}
          <div className="space-y-2.5 p-4">
            <div>
              <p className="text-[17px] font-extrabold">
                {hotel.title || `Your ${noun} name`}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                {homestay
                  ? singleUnit
                    ? "Entire home"
                    : "Homestay"
                  : hotel.hotelType || "Hotel"}{" "}
                · {hotel.location || "Location"}
              </p>
            </div>
            {homestay && host.hostName && (
              <p className="text-sm text-slate-600">
                Hosted by <strong>{host.hostName}</strong>
              </p>
            )}
            {fromPrice !== null && (
              <p className="text-sm">
                <span className="text-slate-500">from</span>{" "}
                <strong>PKR {fromPrice.toLocaleString()}</strong>{" "}
                <span className="text-slate-500">/ night</span>
              </p>
            )}
            {rooms.length > 0 && !singleUnit && (
              <ul className="divide-y divide-slate-100 border-t border-slate-100 text-sm">
                {rooms.map((room, index) => (
                  <li key={index} className="flex justify-between gap-3 py-2">
                    <span className="truncate">{room.input.name}</span>
                    <strong>{room.input.basePrice.toLocaleString()}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
