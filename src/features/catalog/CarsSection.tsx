import { useState } from 'react';
import { Car, Fuel, Gauge, User, Users } from 'lucide-react';
import { Listing } from '../../types';
import { useListings } from '../../shared/hooks/useListings';
import { useWishlist } from '../../shared/hooks/useWishlist';
import { useLanguage } from '../../app/LanguageContext';
import {
  CategoryGrid, DateField, LandingHero, ListingGrid, Popover, PopoverDone, PopoverField, PlaceField, SearchConsole,
  filterListings, type LandingCategory, type PlaceOption,
} from './LandingKit';

interface CarsSectionProps {
  onSelectListing: (listing: Listing) => void;
  onTriggerSearch?: (params: any) => void;
}

const PLACES: PlaceOption[] = [
  { name: 'Skardu Airport & City', region: 'Skardu', desc: 'Direct airport pickup & Deosai 4x4' },
  { name: 'Gilgit Airport & City', region: 'Gilgit', desc: 'Hunza & Karakoram Highway rental' },
  { name: 'Hunza Karimabad', region: 'Hunza', desc: 'Passu, Attabad & Khunjerab drives' },
  { name: 'Islamabad Airport', region: 'Islamabad', desc: 'Long-haul luxury highway cruisers' },
];

const CATEGORIES: LandingCategory[] = [
  { id: 'suv-4x4', title: '4x4 Mountain SUVs', subtitle: 'Land Cruiser & Prado for rough terrain', icon: Car, bgImage: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-400/40' },
  { id: 'fortuner', title: 'Fortuner Cruisers', subtitle: 'Comfortable power drives for families', icon: Gauge, bgImage: 'https://images.unsplash.com/photo-1606016159991-dfe4f974be5c?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-blue-500/20 text-blue-400 border-blue-400/40' },
  { id: 'grand-cabin', title: 'Executive Vans', subtitle: 'Hiace Grand Cabin for group tours', icon: Users, bgImage: 'https://images.unsplash.com/photo-1520050206274-a1ae446cb3cc?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-purple-500/20 text-purple-400 border-purple-400/40' },
  { id: 'hatchback', title: 'Budget Hatchbacks', subtitle: 'Economical city & local road drives', icon: Fuel, bgImage: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-amber-500/20 text-amber-400 border-amber-400/40' },
  { id: 'sedans', title: 'Highway Sedans', subtitle: 'Smooth, stylish Honda Civic & Corollas', icon: Car, bgImage: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=800&q=80', iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40' },
];

const VEHICLE_TYPES = ['4x4 SUV', 'Prado', 'Van', 'Sedan', 'Hatchback'];

export default function CarsSection({ onSelectListing, onTriggerSearch }: CarsSectionProps) {
  const { isRtl } = useLanguage();
  const { listings } = useListings('car');
  const wishlist = useWishlist();

  const [pickupLocation, setPickupLocation] = useState('Skardu');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [carType, setCarType] = useState('4x4 SUV');
  const [withChauffeur, setWithChauffeur] = useState(true);
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('All');

  const cars = filterListings(listings, location, category, (item) => item.carSpecs?.category);

  return (
    <div className="space-y-12 pb-20 text-left" id="cars-page-container">
      <LandingHero
        id="car"
        image="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=2000&q=80"
        alt="Toyota Land Cruiser 4x4 Mountain Drive"
        icon={Car}
        eyebrow="Rugged 4x4 & Luxury Chauffeur Fleet"
        title={<>Rent Premium 4x4 Vehicles in <span className="text-emerald-300">Gilgit Baltistan</span></>}
        subtitle="Explore Deosai, Khunjerab Pass & Babusar Top with insured 4x4 SUVs, experienced mountain drivers & zero hidden fees."
      />

      <SearchConsole
        id="car"
        icon={Car}
        title="Find & Reserve 4x4 Vehicles"
        submitLabel={isRtl ? 'گاڑیاں تلاش کریں' : 'Search Cars'}
        onSubmit={() => onTriggerSearch?.({ type: 'car', destination: pickupLocation, dates: `${pickupDate} to ${returnDate}`, extra: { carType, withDriver: withChauffeur } })}
      >
        <PlaceField
          label="Pick-up Location"
          placeholder="Airport or city pickup"
          heading="Popular Pick-up Locations"
          value={pickupLocation}
          defaultValue="Skardu"
          options={PLACES}
          onChange={setPickupLocation}
        />
        <DateField label="Pick-up Date" value={pickupDate} onChange={(date) => { setPickupDate(date); if (date > returnDate) setReturnDate(date); }} />
        <DateField label="Return Date" value={returnDate} minDate={pickupDate} onChange={setReturnDate} />
        <PopoverField label="Vehicle & Driver Option" icon={Car} span="lg:col-span-3" value={`${carType} • ${withChauffeur ? 'With Driver' : 'Self Drive'}`}>
          {(close) => (
            <Popover>
              <div>
                <p className="text-xs font-bold text-slate-800 mb-2">Select Vehicle Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {VEHICLE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCarType(type)}
                      className={`p-2 rounded-xl text-xs font-bold text-left border ${carType === type ? 'bg-[#006F3C]/10 text-[#006F3C] border-[#006F3C]/30' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Chauffeur Service</p>
                  <p className="text-[10px] text-slate-500">Includes experienced local driver</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={withChauffeur}
                  aria-label="Chauffeur service"
                  onClick={() => setWithChauffeur(!withChauffeur)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${withChauffeur ? 'bg-[#006F3C]' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${withChauffeur ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              <PopoverDone onClick={close} />
            </Popover>
          )}
        </PopoverField>
      </SearchConsole>

      <CategoryGrid
        title="Explore Vehicles by Category"
        subtitle="Select rugged 4x4 Land Cruisers, group vans, or economical sedans"
        viewAllLabel="View all Vehicles"
        categories={CATEGORIES}
        selected={category}
        onSelect={setCategory}
      />

      <ListingGrid
        filterLabel="Region"
        locations={['All', 'Skardu', 'Gilgit', 'Hunza', 'Islamabad']}
        location={location}
        onLocation={setLocation}
        countText="verified vehicles"
        listings={cars}
        details={(car) => {
          const specs = car.carSpecs;
          return {
            badgeIcon: Car,
            badge: specs?.category || '4x4 Vehicle',
            note: { icon: User, text: specs?.withDriver ? 'Driver Included' : 'Self-Drive Option' },
            chips: specs ? [
              { icon: Users, text: `${specs.seats} Seats` },
              { icon: Gauge, text: specs.transmission },
              { icon: Fuel, text: specs.fuelType },
            ] : [],
            priceLabel: 'Per day',
            unit: 'day',
            cta: 'Reserve Car',
          };
        }}
        emptyIcon={Car}
        emptyTitle="No vehicles found for this filter"
        emptyHint="Try changing your location or category selection above."
        onReset={() => { setCategory('All'); setLocation('All'); }}
        wishlist={wishlist}
        onSelectListing={onSelectListing}
      />
    </div>
  );
}
