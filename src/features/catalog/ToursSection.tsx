import { useState } from 'react';
import { Award, Check, Clock, Compass, Mountain, Sparkles, User, Users } from 'lucide-react';
import { Listing } from '../../types';
import { useListings } from '../../shared/hooks/useListings';
import { useWishlist } from '../../shared/hooks/useWishlist';
import { useLanguage } from '../../app/LanguageContext';
import {
  CategoryGrid, CounterRow, DateField, LandingHero, ListingGrid, Popover, PopoverDone, PopoverField, PlaceField, SearchConsole,
  filterListings, type LandingCategory, type PlaceOption,
} from './LandingKit';

interface ToursSectionProps {
  onSelectListing: (listing: Listing) => void;
  onTriggerSearch?: (params: any) => void;
}

const PLACES: PlaceOption[] = [
  { name: 'Hunza & Skardu Expedition', region: 'Gilgit-Baltistan', desc: 'Autumn poplars, lakes & Karakoram forts' },
  { name: 'Deosai Plateau Wilderness', region: 'Skardu', desc: 'Brown bear safari & high-altitude stargazing' },
  { name: 'Khunjerab & Upper Hunza', region: 'Gojal', desc: 'China border, Passu Cones & Attabad lake' },
  { name: 'Cherry Blossom Special', region: 'Hunza Valley', desc: 'Spring blooms, Karimabad & Altit orchard walks' },
];

const CATEGORIES: LandingCategory[] = [
  { id: 'autumn-tours', title: 'Autumn Odyssey', subtitle: 'Golden poplars & red foliage landscapes', icon: Sparkles, bgImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-[#FF7D29]/20 text-[#FF7D29] border-[#FF7D29]/40' },
  { id: 'deosai-safari', title: 'Deosai Safari', subtitle: 'Land of Giants plateau & star glamping', icon: Mountain, bgImage: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40' },
  { id: 'blossom-tours', title: 'Spring Blossom', subtitle: 'Pink & white cherry blooms across Hunza', icon: Compass, bgImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-pink-500/20 text-pink-400 border-pink-400/40' },
  { id: 'luxury-expeditions', title: '5-Star Expeditions', subtitle: 'Luxury hotels, private 4x4 & flight tickets', icon: Award, bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-amber-500/20 text-amber-400 border-amber-400/40' },
  { id: 'cultural-heritage', title: 'Heritage & Forts', subtitle: 'Baltit, Altit & Shigar royal heritage', icon: User, bgImage: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-blue-500/20 text-blue-400 border-blue-400/40' },
];

const DURATIONS = ['3 Days / 2 Nights', '5 Days / 4 Nights', '7 Days / 6 Nights', '10 Days / 9 Nights'];

export default function ToursSection({ onSelectListing, onTriggerSearch }: ToursSectionProps) {
  const { isRtl } = useLanguage();
  const { listings } = useListings('tour');
  const wishlist = useWishlist();

  const [region, setRegion] = useState('Hunza & Skardu');
  const [departureDate, setDepartureDate] = useState('');
  const [duration, setDuration] = useState('7 Days');
  const [travelers, setTravelers] = useState(2);
  // Tour styles highlight a tile only; tour listings carry no style field to filter on.
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('All');

  const tours = filterListings(listings, location, 'All');

  return (
    <div className="space-y-12 pb-20 text-left" id="tours-page-container">
      <LandingHero
        id="tour"
        image="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80"
        alt="Autumn Odyssey in Hunza Valley"
        icon={Compass}
        eyebrow="All-Inclusive Tailored Mountain Expeditions"
        title={<>Guided Tour Packages in <span className="text-emerald-300">Gilgit Baltistan</span></>}
        subtitle="Handcrafted itineraries with stays at luxury resorts, private 4x4 Prado transportation, expert local guides & fort entry permits included."
      />

      <SearchConsole
        id="tour"
        icon={Compass}
        title="Search Guided Packages & Expeditions"
        submitLabel={isRtl ? 'ٹورز تلاش کریں' : 'Search Tours'}
        onSubmit={() => onTriggerSearch?.({ type: 'tour', destination: region, dates: departureDate, guests: travelers })}
      >
        <PlaceField
          label="Destination Region"
          placeholder="Search Hunza, Skardu or Deosai"
          heading="Popular Tour Expeditions"
          value={region}
          defaultValue="Hunza & Skardu"
          options={PLACES}
          onChange={setRegion}
        />
        <DateField label="Departure Date" value={departureDate} onChange={setDepartureDate} />
        <PopoverField label="Tour Duration" icon={Clock} span="lg:col-span-2" value={duration}>
          {(close) => (
            <Popover width="max-w-[240px]" padded={false}>
              {DURATIONS.map((option) => (
                <div
                  key={option}
                  onClick={() => { setDuration(option); close(); }}
                  className={`p-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${duration === option ? 'bg-[#006F3C]/10 text-[#006F3C]' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  {option}
                </div>
              ))}
            </Popover>
          )}
        </PopoverField>
        <PopoverField label="Travelers" icon={Users} span="lg:col-span-3" value={`${travelers} Person${travelers > 1 ? 's' : ''}`}>
          {(close) => (
            <Popover>
              <CounterRow label="Total Travelers" hint="Group members & family" value={travelers} min={1} max={20} onChange={setTravelers} />
              <PopoverDone onClick={close} />
            </Popover>
          )}
        </PopoverField>
      </SearchConsole>

      <CategoryGrid
        title="Explore Tour Packages by Style"
        subtitle="Autumn foliage, Deosai safari expeditions & cherry blossom group tours"
        viewAllLabel="View all Tour Packages"
        categories={CATEGORIES}
        selected={category}
        onSelect={setCategory}
      />

      <ListingGrid
        filterLabel="Destination"
        locations={['All', 'Hunza', 'Skardu', 'Deosai', 'Passu']}
        location={location}
        onLocation={setLocation}
        countText="guided tour packages"
        listings={tours}
        details={(tour) => {
          const specs = tour.tourSpecs;
          return {
            badgeIcon: Clock,
            badge: specs?.durationDays ? `${specs.durationDays} Days / ${specs.durationDays - 1} Nights` : 'All Inclusive',
            note: { icon: Users, text: `Max Group: ${specs?.maxGroupSize || 12} People` },
            chips: (specs?.included ?? []).slice(0, 3).map((text) => ({ icon: Check, text })),
            priceLabel: 'Total package price',
            unit: 'traveler',
            cta: 'Book Expedition',
          };
        }}
        emptyIcon={Compass}
        emptyTitle="No tour packages found for this filter"
        emptyHint="Try changing your location selection above."
        onReset={() => { setCategory('All'); setLocation('All'); }}
        wishlist={wishlist}
        onSelectListing={onSelectListing}
      />
    </div>
  );
}
