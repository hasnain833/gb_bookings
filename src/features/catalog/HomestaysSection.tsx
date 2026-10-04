import { useState } from 'react';
import { ArrowRight, Check, Heart, Home, MapPin, Mountain, Send, Star, User, Users, Wallet, Waves } from 'lucide-react';
import { Listing, handleImageError } from '../../types';
import { useListings } from '../../shared/hooks/useListings';
import { useWishlist } from '../../shared/hooks/useWishlist';
import { useLanguage } from '../../app/LanguageContext';
import { CounterRow, DateField, LandingHero, Popover, PopoverDone, PopoverField, PlaceField, SearchConsole, type PlaceOption } from './LandingKit';

interface HomestaysSectionProps {
  onSelectListing: (listing: Listing) => void;
  onTriggerSearch?: (params: any) => void;
}

const PLACES: PlaceOption[] = [
  { name: 'Hunza Valley', region: 'Gilgit-Baltistan', desc: 'Karimabad, Attabad Lake, Passu Cones' },
  { name: 'Skardu', region: 'Gilgit-Baltistan', desc: 'Shangrila Lake, Cold Desert, Deosai' },
  { name: 'Karimabad', region: 'Hunza', desc: 'Baltit Fort, Altit Fort & Local Bazaar' },
  { name: 'Shigar Valley', region: 'Baltistan', desc: 'Historic Shigar Fort & Orchards' },
  { name: 'Passu & Gojal', region: 'Upper Hunza', desc: 'Passu Cones & Glacier Views' },
  { name: 'Ghanche & Khaplu', region: 'Baltistan', desc: 'Khaplu Palace & Organic Farms' },
  { name: 'Gilgit City', region: 'Capital District', desc: 'Gilgit River & Naltar Valley Access' },
  { name: 'Attabad Lake', region: 'Hunza', desc: 'Turquoise Water Resorts & Chalets' },
];

const experiences = [
  { id: 'mountain-view', title: 'Mountain View', subtitle: 'Wake up to stunning mountain views', icon: Mountain, bgImage: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80' },
  { id: 'family-friendly', title: 'Family Friendly', subtitle: 'Perfect stays for you and your family', icon: Users, bgImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' },
  { id: 'lakeside-stays', title: 'Lakeside Stays', subtitle: 'Relax by the serene lakes and rivers', icon: Waves, bgImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80' },
  { id: 'local-culture', title: 'Local Culture', subtitle: 'Immerse in local life and traditions', icon: Home, bgImage: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80' },
  { id: 'budget-friendly', title: 'Budget Friendly', subtitle: 'Comfortable stays that fit your budget', icon: Wallet, bgImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80' },
];

export default function HomestaysSection({ onSelectListing, onTriggerSearch }: HomestaysSectionProps) {
  const { t, isRtl } = useLanguage();
  const { listings } = useListings('homestay');
  const wishlist = useWishlist();

  const [destination, setDestination] = useState('Hunza Valley');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [roomCount, setRoomCount] = useState(1);
  const [selectedExperience, setSelectedExperience] = useState('All');

  const homestayListings = listings.filter((item) => {
    const expType = item.homestaySpecs?.experienceType;
    return selectedExperience === 'All' || !expType || expType.toLowerCase() === selectedExperience.toLowerCase();
  });

  // Real counts from the catalog (matched on the first word of the place name, e.g. "Hunza").
  const homestaysIn = (place: string) => listings.filter((item) => item.location.toLowerCase().includes(place.split(' ')[0].toLowerCase())).length;

  return (
    <div className="space-y-12 pb-20 text-left" id="homestays-page-container">
      <LandingHero
        id="homestay"
        image="https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=2000&q=80"
        alt="Authentic Homestay Chalet in Gilgit Baltistan"
        icon={Home}
        eyebrow="Stay Local. Feel at Home."
        title={<>Authentic Homestays in <span className="text-emerald-300">Gilgit Baltistan</span></>}
        subtitle="Experience warm hospitality, local culture, and breathtaking views with our handpicked homestays."
      />

      <SearchConsole
        id="homestay"
        icon={Home}
        title="Find Authentic Homestays"
        submitLabel={isRtl ? 'ہوم اسٹے تلاش کریں' : 'Search Homestays'}
        onSubmit={() => onTriggerSearch?.({ type: 'homestay', destination, dates: `${checkIn} to ${checkOut}`, guests: guestCount })}
      >
        <PlaceField
          label={isRtl ? 'کہاں جانا چاہتے ہیں؟' : 'Where are you going?'}
          placeholder={isRtl ? 'منزل یا علاقہ تلاش کریں' : 'Search destination, city or area'}
          heading="Popular Homestay Locations"
          value={destination}
          defaultValue="Hunza Valley"
          options={PLACES}
          onChange={setDestination}
        />
        <DateField label={isRtl ? 'چیک ان' : 'Check-in'} value={checkIn} onChange={(date) => { setCheckIn(date); if (date > checkOut) setCheckOut(date); }} />
        <DateField label={isRtl ? 'چیک آؤٹ' : 'Check-out'} value={checkOut} minDate={checkIn} onChange={setCheckOut} />
        <PopoverField label={t('search.guests')} icon={User} span="lg:col-span-3" value={`${guestCount} Guest${guestCount > 1 ? 's' : ''}, ${roomCount} Room${roomCount > 1 ? 's' : ''}`}>
          {(close) => (
            <Popover>
              <CounterRow label="Guests" hint="Ages 13 or above" value={guestCount} min={1} max={20} onChange={setGuestCount} />
              <CounterRow label="Rooms" hint="Number of rooms" value={roomCount} min={1} max={10} onChange={setRoomCount} divided />
              <PopoverDone onClick={close} />
            </Popover>
          )}
        </PopoverField>
      </SearchConsole>

      {/* 3. EXPLORE HOMESTAYS BY EXPERIENCE SECTION (Matching screenshot exact layout) */}
      <section className="space-y-5 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Explore Homestays by Experience
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Find the perfect stay that matches your travel style
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onTriggerSearch) {
                onTriggerSearch({ type: 'homestay' });
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006F3C] hover:text-[#005C32] hover:underline cursor-pointer group shrink-0"
          >
            <span>View all Homestays</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 5 Experience Cards Grid matching screenshot */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {experiences.map((exp) => {
            const IconComp = exp.icon;
            return (
              <div
                key={exp.id}
                onClick={() => {
                  setSelectedExperience(exp.title);
                  if (onTriggerSearch) {
                    onTriggerSearch({ type: 'homestay', experience: exp.title });
                  }
                }}
                className="relative h-48 sm:h-56 rounded-2xl sm:rounded-2xl overflow-hidden cursor-pointer group shadow-md hover:shadow-lg transition-all duration-300 flex flex-col justify-between p-3 sm:p-4"
              >
                {/* Image Background */}
                <img
                  src={exp.bgImage}
                  alt={exp.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/10" />

                <div className="relative z-10" />

                {/* Bottom Content: Left texts, Right icon badge */}
                <div className="relative z-10 flex items-end justify-between gap-1.5 sm:gap-2">
                  <div className="min-w-0 space-y-0.5 text-white">
                    <h4 className="font-semibold text-xs sm:text-sm text-white leading-tight truncate">
                      {exp.title}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-200 font-medium line-clamp-2 leading-tight">
                      {exp.subtitle}
                    </p>
                  </div>

                  <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 group-hover:bg-[#006F3C] group-hover:border-[#006F3C] transition-colors">
                    <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SECTION: FEATURED HOMESTAYS CAROUSEL */}
      <section className="space-y-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Featured</span>
              <span className="text-[#006F3C]">Homestays</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Handpicked homestays for a comfortable and memorable stay
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onTriggerSearch) {
                onTriggerSearch({ type: 'homestay', destination: 'Gilgit-Baltistan' });
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006F3C] hover:text-[#005C32] hover:underline cursor-pointer group shrink-0"
          >
            <span>View all Homestays</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Featured Homestays Cards Grid */}
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {homestayListings.slice(0, 5).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectListing(item)}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/60 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col justify-between"
            >
              <div className="relative h-40 sm:h-44 overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-md bg-[#006F3C] text-white">
                  {item.featured ? 'Featured' : 'Available'}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); void wishlist.toggle(item.id); }}
                  aria-label={wishlist.isSaved(item.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-red-500 transition-colors shadow-md"
                >
                  <Heart className={`w-3.5 h-3.5 ${wishlist.isSaved(item.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                </button>
              </div>

              <div className="p-3 sm:p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#006F3C] transition-colors leading-snug line-clamp-1 break-words">
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-[11px] font-medium flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-[#006F3C] shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </p>

                  <div className="flex items-center gap-1 mt-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 stroke-none" />
                    <span className="font-semibold text-slate-900 text-xs">{item.rating}</span>
                    <span className="text-slate-400 text-[10px] font-medium">({item.reviewsCount} Reviews)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    PKR {item.price.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">/night</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TOP DESTINATIONS FOR HOMESTAYS */}
      <section className="space-y-5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Top Destinations for</span>
              <span className="text-[#006F3C]">Homestays</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Stay close to nature and explore the beauty of Gilgit Baltistan
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onTriggerSearch) {
                onTriggerSearch({ type: 'destination' });
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006F3C] hover:text-[#005C32] hover:underline cursor-pointer group shrink-0"
          >
            <span>View all Destinations</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 6 Destination Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { name: 'Hunza Valley', img: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=600&q=80' },
            { name: 'Skardu', img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80' },
            { name: 'Khaplu', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
            { name: 'Astore Valley', img: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80' },
            { name: 'Shigar Valley', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80' },
            { name: 'Gojal Valley', img: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=600&q=80' }
          ].map((dest, i) => (
            <div
              key={i}
              onClick={() => {
                setDestination(dest.name);
                if (onTriggerSearch) {
                  onTriggerSearch({ type: 'homestay', destination: dest.name });
                }
              }}
              className="relative h-44 rounded-2xl overflow-hidden cursor-pointer group shadow-2xs hover:shadow-md transition-all duration-300"
            >
              <img
                src={dest.img}
                alt={dest.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h4 className="font-semibold text-sm text-white leading-tight flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#4ade80] shrink-0" />
                  <span>{dest.name}</span>
                </h4>
                <p className="text-[10px] text-slate-200 font-medium mt-0.5 ml-4">
                  {homestaysIn(dest.name) ? `${homestaysIn(dest.name)} homestay${homestaysIn(dest.name) > 1 ? 's' : ''}` : 'No homestays yet'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. PAY AT THE PROPERTY BANNER */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-slate-950 via-[#004d2a] to-[#006F3C] text-white shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-5 z-10">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                Book now, <span className="text-emerald-300">pay when you arrive</span>
              </h3>
              <p className="text-slate-200 text-xs sm:text-sm max-w-lg font-medium">
                Reserve your homestay online and pay your host at check-in.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-sm font-medium">
                <Check className="w-4 h-4 text-emerald-300" />
                <span>No payment today</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-sm font-medium">
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Free cancellation before check-in</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 text-sm font-medium">
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Confirmed by your host</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onTriggerSearch) {
                    onTriggerSearch({ type: 'homestay' });
                  }
                }}
                className="px-6 py-3 bg-white hover:bg-slate-100 text-[#006F3C] font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Find a homestay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 h-48 lg:h-full relative overflow-hidden min-h-[220px]">
            <img
              src="https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1000&q=80"
              alt="Mountain Balcony Homestay View"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
              onError={handleImageError}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#004d2a] via-transparent to-transparent lg:block hidden" />
          </div>
        </div>
      </section>

      {/* 8. NEWSLETTER */}
      <section className="max-w-2xl">
        {/* Subscribe to Newsletter */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006F3C] flex items-center justify-center">
              <Send className="w-6 h-6 text-[#006F3C]" />
            </div>
            <h4 className="text-xl font-semibold text-slate-900">
              Subscribe to Our <span className="text-[#006F3C]">Newsletter</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Get the latest homestay deals, travel tips &amp; updates delivered straight to your inbox.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); }} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="Enter your email address"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 focus:outline-none focus:border-[#006F3C]"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-[#006F3C] hover:bg-[#005C32] text-white rounded-xl text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
