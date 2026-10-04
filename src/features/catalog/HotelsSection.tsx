import { useState } from 'react';
import { Bed, Building2, Mountain, Sparkles, Users, Waves } from 'lucide-react';
import { Listing } from '../../types';
import { useListings } from '../../shared/hooks/useListings';
import { useWishlist } from '../../shared/hooks/useWishlist';
import { useLanguage } from '../../app/LanguageContext';
import {
  CategoryGrid, CounterRow, DateField, LandingHero, ListingGrid, Popover, PopoverDone, PopoverField, PlaceField, SearchConsole,
  filterListings, type LandingCategory, type PlaceOption,
} from './LandingKit';

interface HotelsSectionProps {
  onSelectListing: (listing: Listing) => void;
  onTriggerSearch?: (params: any) => void;
}

const PLACES: PlaceOption[] = [
  { name: 'Attabad Lake', region: 'Hunza Valley', desc: 'Luxury lakeside resorts & cliffside views' },
  { name: 'Skardu', region: 'Gilgit-Baltistan', desc: 'Shangrila, Lower Kachura & Deosai access' },
  { name: 'Karimabad', region: 'Hunza', desc: 'Heritage hotels & Eagle Nest viewpoints' },
  { name: 'Islamabad', region: 'Capital District', desc: '5-Star luxury & Margalla Hills views' },
  { name: 'Malam Jabba', region: 'Swat Valley', desc: 'Alpine ski resorts & chairlift access' },
  { name: 'Shigar Valley', region: 'Baltistan', desc: 'Fort resorts & historic stone architecture' },
];

const CATEGORIES: LandingCategory[] = [
  { id: 'luxury-resorts', title: 'Luxury Resorts', subtitle: '5-Star world-class amenities & views', icon: Sparkles, bgImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40' },
  { id: 'lakeside-resorts', title: 'Lakeside Lodges', subtitle: 'Direct water edge & private boating', icon: Waves, bgImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40' },
  { id: 'alpine-lodges', title: 'Alpine Ski Lodges', subtitle: 'Ski-in / ski-out with fireside lounges', icon: Mountain, bgImage: 'https://images.unsplash.com/photo-1518098268026-4e43a1a009de?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-blue-500/20 text-blue-400 border-blue-400/40' },
  { id: 'heritage-hotels', title: 'Heritage Forts', subtitle: 'Restored royal castles & fort suites', icon: Building2, bgImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-amber-500/20 text-amber-400 border-amber-400/40' },
  { id: 'boutique-stays', title: 'Boutique Stays', subtitle: 'Cozy, personalized mountain hospitality', icon: Bed, bgImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-purple-500/20 text-purple-400 border-purple-400/40' },
];

export default function HotelsSection({ onSelectListing, onTriggerSearch }: HotelsSectionProps) {
  const { isRtl } = useLanguage();
  const { listings } = useListings('hotel');
  const wishlist = useWishlist();

  const [destination, setDestination] = useState('Skardu');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [roomCount, setRoomCount] = useState(1);
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('All');

  const hotels = filterListings(listings, location, category, (item) => item.hotelSpecs?.hotelType);

  return (
    <div className="space-y-12 pb-20 text-left" id="hotels-page-container">
      <LandingHero
        id="hotel"
        image="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=80"
        alt="Luxury Resort in Hunza Valley"
        icon={Building2}
        eyebrow="World-Class Alpine Hospitality"
        title={<>Luxury Hotels &amp; Resorts in <span className="text-emerald-300">Gilgit Baltistan</span></>}
        subtitle="From heated infinity pools on turquoise lake edges to alpine ski lodges and heritage fort hotels."
      />

      <SearchConsole
        id="hotel"
        icon={Building2}
        title="Search Luxury Hotels & Resorts"
        submitLabel={isRtl ? 'ہوٹل تلاش کریں' : 'Search Hotels'}
        onSubmit={() => onTriggerSearch?.({ type: 'hotel', destination, dates: `${checkIn} to ${checkOut}`, guests: guestCount })}
      >
        <PlaceField
          label={isRtl ? 'کہاں جانا چاہتے ہیں؟' : 'Where are you staying?'}
          placeholder="Search city, lake or valley"
          heading="Popular Hotel Locations"
          value={destination}
          defaultValue="Skardu"
          options={PLACES}
          onChange={setDestination}
        />
        <DateField label="Check-in Date" value={checkIn} onChange={(date) => { setCheckIn(date); if (date > checkOut) setCheckOut(date); }} />
        <DateField label="Check-out Date" value={checkOut} minDate={checkIn} onChange={setCheckOut} />
        <PopoverField label="Guests & Rooms" icon={Users} span="lg:col-span-3" value={`${guestCount} Guest${guestCount > 1 ? 's' : ''}, ${roomCount} Room${roomCount > 1 ? 's' : ''}`}>
          {(close) => (
            <Popover>
              <CounterRow label="Guests" hint="Adults & Children" value={guestCount} min={1} max={20} onChange={setGuestCount} />
              <CounterRow label="Rooms" hint="Suites / Rooms" value={roomCount} min={1} max={10} onChange={setRoomCount} divided />
              <PopoverDone onClick={close} />
            </Popover>
          )}
        </PopoverField>
      </SearchConsole>

      <CategoryGrid
        title="Explore Hotels by Category"
        subtitle="Choose from luxury resorts, lakeside lodges & historic castle stays"
        viewAllLabel="View all Hotels"
        categories={CATEGORIES}
        selected={category}
        onSelect={setCategory}
      />

      <ListingGrid
        filterLabel="Location"
        locations={['All', 'Attabad Lake', 'Skardu', 'Islamabad', 'Swat']}
        location={location}
        onLocation={setLocation}
        countText="luxury hotels & resorts"
        listings={hotels}
        details={(hotel) => ({
          badgeIcon: Building2,
          badge: hotel.hotelSpecs?.hotelType || 'Luxury Hotel',
          note: hotel.hotelSpecs?.roomsAvailable ? { icon: Bed, text: `${hotel.hotelSpecs.roomsAvailable} Rooms Left` } : undefined,
          chips: (hotel.hotelSpecs?.amenities ?? []).slice(0, 3).map((text) => ({ text })),
          priceLabel: 'Per night',
          unit: 'night',
          cta: 'Book Room',
        })}
        emptyIcon={Building2}
        emptyTitle="No hotels found for this filter"
        emptyHint="Try changing your location or category selection above."
        onReset={() => { setCategory('All'); setLocation('All'); }}
        wishlist={wishlist}
        onSelectListing={onSelectListing}
      />
    </div>
  );
}
