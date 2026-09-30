import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Building2, CheckCircle2, FileText, Hotel, LoaderCircle, Upload } from 'lucide-react';
import { ApiError, EXPERIENCE_TYPES, api, type VendorListing, type VendorProfile } from '../../shared/api/api';
import RoomManager from './RoomManager';
import VendorReservations from './VendorReservations';

interface VendorDashboardProps { setView: (view: string) => void }
const inputClass = 'min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#006F3C]';

export default function VendorDashboard({ setView: _setView }: VendorDashboardProps) {
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [listings, setListings] = useState<VendorListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [business, setBusiness] = useState({ name: '', email: '', phone: '', registrationNumber: '', taxNumber: '', businessType: 'hotel' as VendorProfile['businessType'], line1: '', city: '', region: 'Gilgit-Baltistan' });
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('business_registration');
  const [hotel, setHotel] = useState({ type: 'hotel' as VendorListing['type'], hostName: '', experienceType: EXPERIENCE_TYPES[0] as typeof EXPERIENCE_TYPES[number], title: '', location: '', description: '', price: '', hotelType: 'Hotel', amenities: '', facilities: '', policies: '', checkInTime: '14:00', checkOutTime: '11:00', roomName: '', bedType: 'Double', maxAdults: '2', maxChildren: '1', totalRooms: '1' });
  const [hotelImage, setHotelImage] = useState<File | null>(null);
  const [openListingId, setOpenListingId] = useState<string | null>(null);

  useEffect(() => {
    api.getMyVendor()
      .then(async (result) => {
        setVendor(result.data);
        if (result.data.status === 'approved') setListings(await api.getVendorListings());
      })
      .catch((error) => {
        if (!(error instanceof ApiError && error.status === 404)) setMessage(error instanceof Error ? error.message : 'Unable to load vendor account.');
      })
      .finally(() => setLoading(false));
  }, []);

  const createApplication = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const result = await api.createVendorApplication({
        name: business.name, email: business.email, phone: business.phone, businessType: business.businessType,
        registrationNumber: business.registrationNumber, taxNumber: business.taxNumber || undefined,
        address: { line1: business.line1, city: business.city, region: business.region, country: 'PK' },
      });
      setVendor(result.data); setMessage('Vendor draft created. Add a verification document before submitting.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to create vendor application.'); }
    finally { setBusy(false); }
  };

  const attachDocument = async () => {
    if (!documentFile) return;
    setBusy(true); setMessage('');
    try {
      const upload = await api.uploadMedia('documents', documentFile);
      const result = await api.attachVendorDocument(documentType, upload.data.id);
      setVendor(result.data); setDocumentFile(null); setMessage('Verification document attached.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to upload the document.'); }
    finally { setBusy(false); }
  };

  const submitVendor = async () => {
    setBusy(true); setMessage('');
    try { const result = await api.submitVendorApplication(); setVendor(result.data); setMessage('Application submitted for review.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to submit the application.'); }
    finally { setBusy(false); }
  };

  const createHotel = async (event: FormEvent) => {
    event.preventDefault();
    if (!hotelImage) { setMessage('Select a hotel image.'); return; }
    setBusy(true); setMessage('');
    try {
      const upload = await api.uploadMedia('images', hotelImage);
      const created = await api.createHotelListing({
        type: hotel.type,
        ...(hotel.type === 'homestay' ? { homestaySpecs: { hostName: hotel.hostName, experienceType: hotel.experienceType } } : {}),
        title: hotel.title, location: hotel.location, description: hotel.description, price: Number(hotel.price), imageIds: [upload.data.id],
        hotelSpecs: {
          hotelType: hotel.type === 'homestay' ? 'Homestay' : hotel.hotelType,
          amenities: hotel.amenities.split(',').map((value) => value.trim()).filter(Boolean),
          facilities: hotel.facilities.split(',').map((value) => value.trim()).filter(Boolean),
          policies: hotel.policies.split(',').map((value) => value.trim()).filter(Boolean),
          checkInTime: hotel.checkInTime, checkOutTime: hotel.checkOutTime,
        },
      });
      await api.addHotelRoom(created.data.id, {
        name: hotel.roomName, bedType: hotel.bedType, maxAdults: Number(hotel.maxAdults), maxChildren: Number(hotel.maxChildren),
        totalRooms: Number(hotel.totalRooms), basePrice: Number(hotel.price), amenities: [],
      });
      // Left as a draft so the vendor can add more room categories before submitting.
      setListings((items) => [created.data, ...items]);
      setOpenListingId(created.data.id);
      setMessage(`${hotel.type === 'homestay' ? 'Homestay' : 'Hotel'} saved as a draft. Add any other room categories below, then submit it for review.`); setHotelImage(null);
      setHotel((current) => ({ ...current, title: '', location: '', description: '', price: '', roomName: '' }));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to create the hotel.'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><LoaderCircle className="size-7 animate-spin text-[#006F3C]" /></div>;

  return (
    <div className="space-y-8 pb-16">
      <header><h1 className="text-2xl font-bold text-slate-900">Vendor Console</h1><p className="text-sm text-slate-500">Manage verification, reservations and property inventory.</p></header>
      {message && <p className="border-l-4 border-[#006F3C] bg-emerald-50 p-3 text-sm text-slate-700" role="status">{message}</p>}

      {!vendor && (
        <form onSubmit={createApplication} className="space-y-5 border-y border-slate-200 py-6">
          <div className="flex items-center gap-3"><Building2 className="size-5 text-[#006F3C]" /><h2 className="font-bold text-slate-900">Register your business</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Business name"><input className={inputClass} required value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} /></Field>
            <Field label="Business email"><input className={inputClass} type="email" required value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} /></Field>
            <Field label="Phone"><input className={inputClass} required value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} /></Field>
            <Field label="Registration number"><input className={inputClass} required value={business.registrationNumber} onChange={(e) => setBusiness({ ...business, registrationNumber: e.target.value })} /></Field>
            <Field label="Street address"><input className={inputClass} required value={business.line1} onChange={(e) => setBusiness({ ...business, line1: e.target.value })} /></Field>
            <Field label="City"><input className={inputClass} required value={business.city} onChange={(e) => setBusiness({ ...business, city: e.target.value })} /></Field>
          </div>
          <button disabled={busy} className="min-h-11 rounded-md bg-[#006F3C] px-5 text-sm font-bold text-white disabled:opacity-50">Create vendor draft</button>
        </form>
      )}

      {vendor && vendor.status !== 'approved' && (
        <section className="space-y-5 border-y border-slate-200 py-6">
          <div className="flex items-center justify-between gap-4"><div><h2 className="font-bold text-slate-900">{vendor.name}</h2><p className="text-sm text-slate-500">Application status: <strong>{vendor.status}</strong></p></div><FileText className="size-6 text-slate-400" /></div>
          {vendor.rejectionReason && <p className="bg-rose-50 p-3 text-sm text-rose-700">{vendor.rejectionReason}</p>}
          {['draft', 'rejected'].includes(vendor.status) && <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Document type"><select className={inputClass} value={documentType} onChange={(e) => setDocumentType(e.target.value)}><option value="business_registration">Business registration</option><option value="identity">Owner identity</option><option value="tax">Tax document</option><option value="property_authorization">Property authorization</option></select></Field>
              <Field label="PDF document" grow><input type="file" accept="application/pdf" className={`${inputClass} pt-2`} onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)} /></Field>
              <button type="button" disabled={busy || !documentFile} onClick={attachDocument} className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-bold"><Upload className="size-4" />Upload</button>
            </div>
            <p className="text-xs text-slate-500">{vendor.verificationDocuments?.length ?? 0} verification document(s) attached.</p>
            <button type="button" disabled={busy || !vendor.verificationDocuments?.length} onClick={submitVendor} className="min-h-11 rounded-md bg-[#006F3C] px-5 text-sm font-bold text-white disabled:opacity-50">Submit for approval</button>
          </>}
        </section>
      )}

      {vendor?.status === 'approved' && <>
        <section className="flex items-center gap-3 border-y border-slate-200 py-4"><CheckCircle2 className="size-5 text-emerald-600" /><div><h2 className="font-bold text-slate-900">Approved vendor</h2><p className="text-xs text-slate-500">{vendor.name}</p></div></section>
        <VendorReservations />
        <form onSubmit={createHotel} className="space-y-5">
          <div className="flex items-center gap-3"><Hotel className="size-5 text-indigo-600" /><h2 className="font-bold text-slate-900">Add a property</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Property type"><select className={inputClass} value={hotel.type} onChange={(e) => setHotel({ ...hotel, type: e.target.value as VendorListing['type'] })}><option value="hotel">Hotel</option><option value="homestay">Homestay</option></select></Field>
            {hotel.type === 'homestay' ? <>
              <Field label="Host name"><input className={inputClass} required minLength={2} value={hotel.hostName} onChange={(e) => setHotel({ ...hotel, hostName: e.target.value })} /></Field>
              <Field label="Experience"><select className={inputClass} value={hotel.experienceType} onChange={(e) => setHotel({ ...hotel, experienceType: e.target.value as typeof EXPERIENCE_TYPES[number] })}>{EXPERIENCE_TYPES.map((value) => <option key={value}>{value}</option>)}</select></Field>
            </> : <span className="hidden md:block" />}
            <Field label={hotel.type === 'homestay' ? 'Homestay name' : 'Hotel name'}><input className={inputClass} required value={hotel.title} onChange={(e) => setHotel({ ...hotel, title: e.target.value })} /></Field>
            <Field label="Location"><input className={inputClass} required value={hotel.location} onChange={(e) => setHotel({ ...hotel, location: e.target.value })} /></Field>
            <Field label="Base price PKR"><input className={inputClass} type="number" min="0" required value={hotel.price} onChange={(e) => setHotel({ ...hotel, price: e.target.value })} /></Field>
            <Field label="Primary image"><input className={`${inputClass} pt-2`} type="file" accept="image/jpeg,image/png,image/webp,image/avif" required onChange={(e) => setHotelImage(e.target.files?.[0] ?? null)} /></Field>
            <label className="text-xs font-semibold text-slate-600 md:col-span-2">Description<textarea className="mt-1 min-h-28 w-full rounded-md border border-slate-300 p-3 text-sm" minLength={20} required value={hotel.description} onChange={(e) => setHotel({ ...hotel, description: e.target.value })} /></label>
            <Field label="Amenities, comma separated"><input className={inputClass} value={hotel.amenities} onChange={(e) => setHotel({ ...hotel, amenities: e.target.value })} /></Field>
            <Field label={hotel.type === 'homestay' ? 'House rules, comma separated' : 'Policies, comma separated'}><input className={inputClass} value={hotel.policies} onChange={(e) => setHotel({ ...hotel, policies: e.target.value })} /></Field>
            <Field label="Facilities, comma separated"><input className={inputClass} value={hotel.facilities} onChange={(e) => setHotel({ ...hotel, facilities: e.target.value })} /></Field>
            <Field label="First room category"><input className={inputClass} required value={hotel.roomName} onChange={(e) => setHotel({ ...hotel, roomName: e.target.value })} /></Field>
            <Field label="Total rooms"><input className={inputClass} type="number" min="1" required value={hotel.totalRooms} onChange={(e) => setHotel({ ...hotel, totalRooms: e.target.value })} /></Field>
          </div>
          <button disabled={busy} className="min-h-11 rounded-md bg-[#0F172A] px-5 text-sm font-bold text-white disabled:opacity-50">Save as draft</button>
        </form>
        <section>
          <h2 className="mb-3 font-bold text-slate-900">Your properties</h2>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {listings.map((listing) => (
              <div key={listing.id} className="py-4">
                <div className="flex items-center gap-4">
                  <img src={listing.image} alt="" className="size-14 rounded-md object-cover" />
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{listing.title}</p><p className="text-xs text-slate-500">{listing.type === 'homestay' ? 'Homestay' : 'Hotel'} · {listing.location}</p></div>
                  <span className="text-xs font-bold uppercase text-indigo-700">{listing.status}</span>
                  <button type="button" aria-expanded={openListingId === listing.id} onClick={() => setOpenListingId(openListingId === listing.id ? null : listing.id)}
                    className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700">
                    {openListingId === listing.id ? 'Close' : 'Rooms'}
                  </button>
                </div>
                {openListingId === listing.id && (
                  <div className="mt-3">
                    <RoomManager listing={listing} onListingChange={(updated) => {
                      setListings((items) => items.map((item) => item.id === updated.id ? updated : item));
                      setMessage(`${updated.title} submitted for review.`);
                    }} />
                  </div>
                )}
              </div>
            ))}
            {listings.length === 0 && <p className="py-6 text-sm text-slate-500">No properties yet.</p>}
          </div>
        </section>
      </>}
    </div>
  );
}

function Field({ label, grow = false, children }: { label: string; grow?: boolean; children: ReactNode }) {
  return <label className={`text-xs font-semibold text-slate-600 ${grow ? 'flex-1' : ''}`}>{label}<span className="mt-1 block">{children}</span></label>;
}
