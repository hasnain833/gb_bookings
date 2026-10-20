import { useEffect, useState } from "react";
import {
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import {
  api,
  type Paginated,
  type VendorBookingAction,
  type VendorRoom,
} from "../../shared/api/api";
import { useReasonDialog } from "../../shared/components/ReasonDialog";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
import { formatDateForDisplay } from "../../shared/utils/date";
import type { Booking } from "../../types";

type Tab = Booking["status"] | "all" | "arriving" | "in_house";
const statusFilters: Tab[] = [
  "arriving",
  "in_house",
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];
const tabLabels: Partial<Record<Tab, string>> = {
  arriving: "Arriving today",
  in_house: "In house",
};
const CAR_TAB_LABELS: Partial<Record<Tab, string>> = { arriving: "Pickups today", in_house: "On the road" };
const todayPk = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(
    new Date(),
  );
const statusLabel = (status: string) => status.replace("_", "-");
const statusStyle: Record<Booking["status"], string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
  no_show: "bg-rose-50 text-rose-700 ring-rose-200",
};
const fieldClass =
  "min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C] focus:ring-2 focus:ring-[#006F3C]/15";

const ACTION_LABELS: Record<VendorBookingAction, string> = {
  confirm: "Confirm", cancel: "Cancel", complete: "Check out", no_show: "No-show", mark_paid: "Mark paid", check_in: "Check in",
};
// Car rentals use the same steps: the car is handed over (check in) and returned (complete).
const CAR_ACTION_LABELS: Partial<Record<VendorBookingAction, string>> = { complete: "Car returned", check_in: "Car handed over" };

// The server decides which actions a booking allows (vendorActions); this only labels them.
const actionsFor = (booking: Booking) =>
  (booking.vendorActions ?? [])
    .filter((action): action is VendorBookingAction => action !== "change")
    .map((action) => ({ action, label: action === "cancel" && booking.status === "pending" ? "Decline" : (booking.rental && CAR_ACTION_LABELS[action]) || ACTION_LABELS[action] }));
const changeable = (booking: Booking) => Boolean(booking.vendorActions?.includes("change"));
const nightsBetween = (from: string, to: string) =>
  Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );

/** New dates, room category or room count for one booking; shows the re-quoted total before saving. */
function ChangeBookingForm({
  booking,
  onCancel,
  onChanged,
}: {
  booking: Booking;
  onCancel: () => void;
  onChanged: (booking: Booking) => void;
}) {
  const [rooms, setRooms] = useState<VendorRoom[] | null>(null);
  const [form, setForm] = useState({
    checkIn: booking.startDate,
    checkOut: booking.endDate,
    roomTypeId: booking.roomTypeId ?? "",
    rooms: booking.rooms ?? 1,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api
      .getHotelRooms(booking.listingId)
      .then(
        (result) =>
          active &&
          setRooms(
            result.filter(
              (room) =>
                room.status === "active" && !room.pendingRevision?.isNew,
            ),
          ),
      )
      .catch((reason: Error) => active && setError(reason.message));
    return () => {
      active = false;
    };
  }, [booking.listingId]);
  const room = rooms?.find((item) => item.id === form.roomTypeId);
  const car = Boolean(booking.rental);
  // Car rentals count the return day too.
  const nights = nightsBetween(form.checkIn, form.checkOut) + (car ? 1 : 0);
  const total =
    room && nights > 0 ? room.basePrice * nights * form.rooms : null;
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      onChanged(await api.changeVendorBooking(booking.id, form));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The booking could not be changed.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      onSubmit={save}
      className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4">
      <p className="text-sm text-slate-600">
        {car
          ? "The car's old days are released and the new ones reserved together. The daily price is re-quoted at today's rate; driver and trip charges keep the booked terms. The guest is emailed."
          : "Rooms on the old dates are released and the new ones reserved together. The price is re-quoted at today's rate and the guest is emailed."}
      </p>
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="text-xs font-semibold text-slate-600">
          {car ? "Pickup" : "Check-in"}
          <input
            type="date"
            required
            min={todayPk()}
            value={form.checkIn}
            onChange={(event) =>
              setForm({ ...form, checkIn: event.target.value })
            }
            className={`${fieldClass} mt-1 w-full`}
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          {car ? "Return" : "Check-out"}
          <input
            type="date"
            required
            min={form.checkIn}
            value={form.checkOut}
            onChange={(event) =>
              setForm({ ...form, checkOut: event.target.value })
            }
            className={`${fieldClass} mt-1 w-full`}
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          {car ? "Car" : "Room"}
          <select
            required
            value={form.roomTypeId}
            onChange={(event) =>
              setForm({ ...form, roomTypeId: event.target.value })
            }
            className={`${fieldClass} mt-1 w-full`}>
            {!rooms && <option value={form.roomTypeId}>Loading…</option>}
            {rooms?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · PKR {item.basePrice.toLocaleString()}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          {car ? "Cars" : "Rooms"}
          <input
            type="number"
            required
            min={1}
            max={20}
            value={form.rooms}
            onChange={(event) =>
              setForm({ ...form, rooms: Number(event.target.value) })
            }
            className={`${fieldClass} mt-1 w-full`}
          />
        </label>
      </div>
      {total !== null && (
        <p className="text-sm">
          {car ? "New car price" : "New total"} <strong>PKR {total.toLocaleString()}</strong>{" "}
          <span className="text-slate-500">
            {car ? "plus driver and trip charges " : ""}(was PKR {booking.totalPrice.toLocaleString()} in total · {nights} {car ? "day" : "night"}
            {nights === 1 ? "" : "s"})
          </span>
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          disabled={busy || !room || nights < 1}
          className="min-h-11 rounded-lg bg-[#006F3C] px-4 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Saving…" : "Save change"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function StatusBadge({ status }: { status: Booking["status"] }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyle[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

/** The hotel's own reservations; only the vendor's team operates them. */
export default function VendorReservations({
  properties = [],
  listingId: initialListingId = "",
  defaultTab = "pending",
  car = false,
}: {
  properties?: Array<{ id: string; title: string }>;
  listingId?: string;
  defaultTab?: Tab;
  /** Car partners: pickups and returns instead of arrivals and stays. */
  car?: boolean;
}) {
  const [status, setStatus] = useState<Tab>(defaultTab);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [listingId, setListingId] = useState(initialListingId);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<
    Paginated<Booking>["pagination"] | null
  >(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { askReason, dialog } = useReasonDialog();
  const query = useDebouncedValue(search.trim());
  const filtered = Boolean(query || from || to || listingId);

  useEffect(() => {
    setPage(1);
  }, [status, query, from, to, listingId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const stay =
      status === "arriving" || status === "in_house" ? status : undefined;
    api
      .getVendorBookings({
        status:
          status === "all" || stay ? undefined : (status as Booking["status"]),
        stay,
        q: query.length >= 2 ? query : undefined,
        from: from || undefined,
        to: to || undefined,
        listingId: listingId || undefined,
        page,
      })
      .then((result) => {
        if (active) {
          setBookings(result.data);
          setPagination(result.pagination);
        }
      })
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status, query, from, to, listingId, page, refresh]);

  const clearFilters = () => {
    setSearch("");
    setFrom("");
    setTo("");
    setListingId("");
  };

  const act = async (booking: Booking, action: VendorBookingAction) => {
    let reason: string | undefined;
    const ref = booking.reference ?? booking.id;
    if (action === "cancel") {
      const declining = booking.status === "pending";
      reason = (
        await askReason({
          title: declining
            ? "Decline reservation request"
            : "Cancel reservation",
          destructive: true,
          confirmLabel: declining ? "Decline request" : "Cancel reservation",
          noteLabel: "Reason for the guest",
          description: `${booking.customerName} · ${ref}. The rooms are released and the guest is emailed this reason.`,
        })
      )?.trim();
      if (!reason) return;
    } else if (action === "mark_paid") {
      if (
        (await askReason({
          title: "Record payment received?",
          confirmLabel: `Record PKR ${booking.totalPrice.toLocaleString()} paid`,
          description: `Confirm the guest ${booking.customerName} paid PKR ${booking.totalPrice.toLocaleString()} at the property for ${ref}. This is logged and cannot be undone here.`,
        })) === null
      )
        return;
    } else if (action === "no_show") {
      if (
        (await askReason({
          title: "Mark as no-show?",
          destructive: true,
          confirmLabel: "Mark no-show",
          description: `${booking.customerName} did not arrive for ${ref}. This cannot be undone.`,
        })) === null
      )
        return;
    }
    setBusyId(booking.id);
    setError(null);
    try {
      const updated = await api.actOnVendorBooking(booking.id, action, reason);
      setBookings((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      // Reload so the server decides whether it still belongs in this tab.
      setRefresh((value) => value + 1);
    } catch (reasonError) {
      setError(
        reasonError instanceof Error
          ? reasonError.message
          : "The booking could not be updated.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const selected = bookings.find((booking) => booking.id === openId) ?? bookings[0];
  const labels = car ? CAR_TAB_LABELS : tabLabels;
  const whatsapp = (phone?: string) => phone && `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "92")}`;

  return (
    <section className="space-y-4" aria-label="Reservations">
      {dialog}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter by status">
        {statusFilters.map((value) => (
          <button key={value} type="button" role="tab" aria-selected={status === value} onClick={() => setStatus(value)}
            className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-bold capitalize transition ${status === value ? "border-[#17211B] bg-[#17211B] text-white" : "border-[#D9DED8] bg-white text-[#3D4A42] hover:bg-[#F7F8F6]"}`}>
            {labels[value] ?? statusLabel(value)}
          </button>
        ))}
        {pagination && <span className="ml-auto text-sm text-[#5B6B61]">{pagination.total} found</span>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-[1_1_260px]">
          <span className="sr-only">Search reservations</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference, guest name, email or phone" className={`${fieldClass} w-full pl-9`} />
        </label>
        {properties.length > 1 && (
          <label>
            <span className="sr-only">Property</span>
            <select value={listingId} onChange={(event) => setListingId(event.target.value)} className={fieldClass}>
              <option value="">All {car ? "cars" : "properties"}</option>
              {properties.map((property) => <option key={property.id} value={property.id}>{property.title}</option>)}
            </select>
          </label>
        )}
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          {car ? "Pickup from" : "Check-in from"}
          <input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} className={fieldClass} />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          to
          <input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} className={fieldClass} />
        </label>
        {filtered && (
          <button type="button" onClick={clearFilters} className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-[#006F3C]"><X className="size-4" />Clear</button>
        )}
      </div>

      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="flex flex-wrap items-start gap-5" aria-live="polite" aria-busy={loading}>
        <div className="min-w-0 flex-[999_1_420px] space-y-3">
          {loading && <div className="flex justify-center py-8"><LoaderCircle className="size-6 animate-spin text-[#006F3C]" aria-label="Loading reservations" /></div>}
          {!loading && bookings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              {status === "arriving" ? (car ? "No pickups left today" : "No guests left to arrive today")
                : status === "in_house" ? (car ? "No cars are out right now" : "No guests are checked in right now")
                  : `No ${status === "all" ? "" : `${statusLabel(status)} `}${car ? "rentals" : "reservations"}`}
              {filtered ? " match your search" : ""}.
            </div>
          )}
          {!loading && bookings.length > 0 && (
            <ul className="overflow-hidden rounded-2xl border border-[#E3E7E2] bg-white">
              {bookings.map((booking) => {
                const on = booking.id === selected?.id;
                const start = new Date(`${booking.startDate}T00:00:00`);
                return (
                  <li key={booking.id} className="border-t border-[#EEF1ED] first:border-t-0">
                    <button type="button" aria-current={on ? "true" : undefined} onClick={() => { setOpenId(booking.id); setChangingId(null); }}
                      className={`flex w-full flex-wrap items-center gap-3 border-l-4 px-4 py-3 text-left text-sm sm:flex-nowrap ${on ? "border-[#006F3C] bg-[#F1F8F4]" : "border-transparent hover:bg-[#F7F8F6]"}`}>
                      <span className="w-[52px] shrink-0 rounded-lg bg-[#F4F5F1] py-1 text-center">
                        <span className="block text-[11px] font-bold uppercase text-[#5B6B61]">{start.toLocaleDateString("en-GB", { month: "short" })}</span>
                        <span className="block text-lg font-extrabold leading-tight">{start.getDate()}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">{booking.customerName}</span>
                        <span className="block truncate text-[13px] text-[#5B6B61]">
                          {booking.rooms ?? 1} × {booking.roomName ?? "Room"} · {booking.duration} {booking.rental ? "day" : "night"}{booking.duration === 1 ? "" : "s"}
                          {properties.length > 1 ? ` · ${booking.listingTitle}` : ""}
                          {booking.rental ? ` · ${booking.rental.driver ? "with driver" : "self-drive"}` : ""}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <StatusBadge status={booking.status} />
                        {booking.checkedInAt && booking.status === "confirmed" && <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-900">{booking.rental ? "Car out" : "In house"}</span>}
                        {booking.paymentStatus === "paid" && <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">Paid</span>}
                      </span>
                      <span className="w-[110px] shrink-0 text-right font-extrabold">PKR {booking.totalPrice.toLocaleString()}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {pagination && pagination.pages > 1 && (
            <nav aria-label="Reservation pages" className="flex items-center justify-end gap-3 text-sm">
              <button type="button" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 disabled:opacity-50">Previous</button>
              <span>Page {pagination.page} of {pagination.pages}</span>
              <button type="button" disabled={loading || page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 disabled:opacity-50">Next</button>
            </nav>
          )}
        </div>

        {!loading && selected && (
          <aside aria-label="Reservation details" className="min-w-0 flex-[1_1_360px] overflow-hidden rounded-2xl border border-[#E3E7E2] bg-white lg:sticky lg:top-6">
            <div className="space-y-3 border-b border-[#EEF1ED] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge status={selected.status} />
                <span className="font-mono text-sm text-[#5B6B61]">{selected.reference}</span>
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">{selected.customerName}</h2>
                <p className="text-sm text-[#5B6B61]">{selected.listingTitle}</p>
              </div>
              {selected.status === "pending" && selected.respondBy && (
                <p className="rounded-lg bg-[#FFF8EB] p-3 text-[13px] font-semibold text-[#7A4A00]">
                  Answer by {new Date(selected.respondBy).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}, or the request expires and the {selected.rental ? "car is" : "rooms are"} released.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {actionsFor(selected).map(({ action, label }) => (
                  <button key={action} type="button" disabled={busyId === selected.id} onClick={() => act(selected, action)}
                    className={`min-h-11 rounded-lg px-4 text-sm font-bold disabled:opacity-50 ${action === "confirm" || action === "complete" || action === "mark_paid" || action === "check_in" ? "bg-[#006F3C] text-white hover:bg-[#005c32]" : action === "cancel" || action === "no_show" ? "border border-[#F1C4C4] text-[#B91C1C] hover:bg-rose-50" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                    {busyId === selected.id && (action === "confirm" || action === "complete" || action === "check_in") ? <LoaderCircle className="mx-auto size-4 animate-spin" /> : label}
                  </button>
                ))}
                {changeable(selected) && (
                  <button type="button" aria-expanded={changingId === selected.id} disabled={busyId === selected.id} onClick={() => setChangingId(changingId === selected.id ? null : selected.id)}
                    className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Change</button>
                )}
                {selected.customerPhone && <a href={whatsapp(selected.customerPhone)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">WhatsApp guest</a>}
              </div>
            </div>
            {changingId === selected.id && (
              <ChangeBookingForm booking={selected} onCancel={() => setChangingId(null)}
                onChanged={(updated) => { setBookings((items) => items.map((item) => (item.id === updated.id ? updated : item))); setChangingId(null); }} />
            )}
            <ReservationDetails booking={selected} />
          </aside>
        )}
      </div>
    </section>
  );
}

function ReservationDetails({ booking }: { booking: Booking }) {
  const rental = booking.rental;
  const rows: Array<[string, string | undefined]> = rental ? [
    ["Guest email", booking.customerEmail],
    ["Guest phone", booking.customerPhone],
    ["Passengers", String(booking.guests ?? booking.adults ?? 1)],
    ["Pickup", `${formatDateForDisplay(booking.startDate)} at ${rental.pickupTime} · ${rental.pickupPlace}`],
    ["Return", `${formatDateForDisplay(booking.endDate)} · ${rental.dropoffPlace}${rental.oneWay ? ` (one-way${rental.oneWayOnRequest ? ", fee to agree with the guest" : ""})` : ""}`],
    ["Driver", rental.driver ? `With driver${rental.driverPerDay ? ` · PKR ${rental.driverPerDay.toLocaleString()}/day` : ""}` : `Self-drive · licence ${rental.licenceNumber ?? "—"}${rental.deposit ? ` · collect deposit PKR ${rental.deposit.toLocaleString()}` : ""}`],
    ["Trip", rental.outsideBaseCity ? `Leaves the base city${rental.outsidePerDay ? ` · +PKR ${rental.outsidePerDay.toLocaleString()}/day` : ""}` : "Within the base city"],
    ["Fuel", rental.fuelIncluded ? "Included" : "Paid by the guest"],
    ["Rate", booking.nightlyRate ? `PKR ${booking.nightlyRate.toLocaleString()} × ${booking.duration} day(s) × ${booking.rooms ?? 1} car(s)` : undefined],
    ["Driver & trip charges", booking.extrasTotal ? `PKR ${booking.extrasTotal.toLocaleString()}` : undefined],
    ["Promo code", booking.couponCode ? `${booking.couponCode} · ${booking.couponLabel} (−PKR ${(booking.discount ?? 0).toLocaleString()})` : undefined],
    ["Total", `PKR ${booking.totalPrice.toLocaleString()}`],
    ["Handed over", booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : undefined],
    ["Payment", booking.paymentStatus === "paid" ? `Paid${booking.paidAt ? ` · recorded ${new Date(booking.paidAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}` : ""}` : "Collect at pickup"],
    ["Booked on", formatDateForDisplay(booking.createdAt)],
  ] : [
    ["Guest email", booking.customerEmail],
    ["Guest phone", booking.customerPhone],
    [
      "Guests",
      `${booking.adults ?? booking.guests} adult(s)${booking.children ? `, ${booking.children} child(ren)` : ""}`,
    ],
    [
      "Check-in",
      `${formatDateForDisplay(booking.startDate)}${booking.checkInTime ? ` from ${booking.checkInTime}` : ""}`,
    ],
    [
      "Check-out",
      `${formatDateForDisplay(booking.endDate)}${booking.checkOutTime ? ` by ${booking.checkOutTime}` : ""}`,
    ],
    [
      "Rate",
      booking.nightlyRate
        ? `PKR ${booking.nightlyRate.toLocaleString()} × ${booking.duration} night(s) × ${booking.rooms ?? 1} room(s)`
        : undefined,
    ],
    [
      "Meals",
      booking.meals?.length
        ? `${booking.meals.map((meal) => meal.type).join(", ")} · PKR ${(booking.mealsTotal ?? 0).toLocaleString()} (per guest per night: ${booking.meals.map((meal) => `${meal.type} ${meal.price.toLocaleString()}`).join(", ")})`
        : undefined,
    ],
    ["Promo code", booking.couponCode ? `${booking.couponCode} · ${booking.couponLabel} (−PKR ${(booking.discount ?? 0).toLocaleString()})` : undefined],
    ["Total", `PKR ${booking.totalPrice.toLocaleString()}`],
    [
      "Arrival",
      booking.checkedInAt
        ? `Checked in ${new Date(booking.checkedInAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`
        : undefined,
    ],
    [
      "Payment",
      booking.paymentStatus === "paid"
        ? `Paid${booking.paidAt ? ` · recorded ${new Date(booking.paidAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}` : ""}`
        : booking.paymentMethod === "pay_at_hotel"
          ? "Collect at the property"
          : booking.paymentStatus,
    ],
    ["Booked on", formatDateForDisplay(booking.createdAt)],
  ];
  return (
    <div className="grid gap-6 p-5 text-sm">
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-slate-500">{label}</dt>
              <dd className="wrap-break-word font-medium text-slate-800">
                {value}
              </dd>
            </div>
          ))}
        {booking.specialRequests && (
          <>
            <dt className="text-slate-500">Requests</dt>
            <dd className="italic text-slate-700">
              “{booking.specialRequests}”
            </dd>
          </>
        )}
      </dl>
      <div>
        <h3 className="mb-2 font-semibold text-slate-900">Status history</h3>
        <ol className="space-y-3 border-l border-slate-200 pl-4">
          {(booking.history ?? []).map((event, index) => (
            <li key={index} className="relative">
              <span className="absolute -left-5.25 top-1.5 size-2.5 rounded-full bg-[#006F3C] ring-4 ring-slate-50" />
              <p className="font-medium capitalize text-slate-800">
                {statusLabel(event.status)}{" "}
                <span className="font-normal text-slate-500">
                  ·{" "}
                  {new Date(event.at).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </p>
              {event.reason && <p className="text-slate-600">{event.reason}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
