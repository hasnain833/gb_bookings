import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MapPin, Compass, Search, Calendar, Users, Star, ArrowRight, ShieldCheck, Heart, Sparkles, Building2, Home, Car
} from 'lucide-react';
import { handleImageError } from '../types';
import { useLanguage } from '../LanguageContext';

interface DestinationsSectionProps {
  onTriggerSearch?: (params: any) => void;
  setView?: (v: string) => void;
}

export default function DestinationsSection({ onTriggerSearch, setView }: DestinationsSectionProps) {
  const { t, isRtl } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const destinations = [
    {
      id: 'hunza-valley',
      name: 'Hunza Valley',
      title: 'Karimabad, Altit & Attabad Lake',
      region: 'Upper Gilgit',
      image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=80',
      bestTime: 'Apr - Nov (Blossom & Autumn)',
      elevation: '2,438 meters',
      topAttractions: ['Baltit & Altit Forts', 'Attabad Turquoise Lake', 'Eagles Nest Viewpoint', 'Passu Cones'],
      hotelsCount: '48 Hotels & Homestays',
      featured: true,
      description: 'World-famous for longevity, breathtaking turquoise lakes, ancient 700-year-old royal forts, and golden autumn apricot orchards under Ultar Sar.'
    },
    {
      id: 'skardu-baltistan',
      name: 'Skardu & Deosai',
      title: 'Gateway to Karakoram K2 Giants',
      region: 'Baltistan',
      image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
      bestTime: 'May - Oct (Summer & Stargazing)',
      elevation: '2,228 meters',
      topAttractions: ['Shangrila Heart Lake', 'Deosai Brown Bear Plain', 'Katpana Cold Desert', 'Shigar Fort'],
      hotelsCount: '36 Luxury Resorts',
      featured: true,
      description: 'The ancient capital of Baltistan, surrounded by the world’s highest high-altitude plateau, cold sand dunes, and the pristine Lower Kachura Lake.'
    },
    {
      id: 'passu-gojal',
      name: 'Passu & Gojal',
      title: 'Majestic Cathedral Peaks & Glaciers',
      region: 'Upper Hunza',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      bestTime: 'May - Oct',
      elevation: '2,800 meters',
      topAttractions: ['Passu Cathedral Cones', 'Borith Lake', 'Hussaini Suspension Bridge', 'Passu Glacier Trek'],
      hotelsCount: '22 Cozy Cabins',
      featured: true,
      description: 'Unmatched dramatic mountain landscapes facing the iconic Passu Cones. Famous for Wakhi culture, suspension bridges, and organic yak burgers.'
    },
    {
      id: 'shigar-valley',
      name: 'Shigar Valley',
      title: 'Oasis of Orchards & Royal Heritage',
      region: 'Baltistan',
      image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
      bestTime: 'May - Oct',
      elevation: '2,300 meters',
      topAttractions: ['Serena Shigar Fort', 'Blind Lake', 'Organic Cherry Orchards', 'Historic Wooden Mosques'],
      hotelsCount: '15 Heritage Stays',
      featured: false,
      description: 'A serene fertile valley where lush fruit orchards flourish amidst snow-covered granite peaks. Home to 17th-century Rajas palace.'
    },
    {
      id: 'naltar-valley',
      name: 'Naltar Valley',
      title: 'Emerald Pine Forests & Satrangi Lakes',
      region: 'Gilgit',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      bestTime: 'Jun - Sep & Winter Skiing',
      elevation: '2,898 meters',
      topAttractions: ['Satrangi (7-Color) Lake', 'Naltar Ski Slope', 'Pine Forest Trails', 'Pari Lake'],
      hotelsCount: '12 Alpine Lodges',
      featured: false,
      description: 'Renowned for its crystal-clear color-shifting alpine lakes, lush pine woods, and Pakistan’s oldest ski tournament slopes.'
    },
    {
      id: 'khaplu-ghanche',
      name: 'Khaplu & Ghanche',
      title: 'Valley of Palaces & Apricot Groves',
      region: 'Baltistan',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      bestTime: 'May - Oct',
      elevation: '2,600 meters',
      topAttractions: ['Khaplu Palace', 'Chaqchan Mosque', 'Thalle Valley', 'Sailing Valley'],
      hotelsCount: '18 Local Stays',
      featured: false,
      description: 'The easternmost valley of Baltistan offering timber-and-stone royal architecture, terraced farmland, and peaceful mountain seclusion.'
    }
  ];

  const filteredDestinations = destinations.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'All') return matchesSearch;
    return matchesSearch && item.region.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  return (
    <div className="space-y-12 pb-20 text-left" id="destinations-page-container">
      
      {/* 1. Full-Bleed Hero Banner matching Homepage ratios */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-8 md:-mt-12 overflow-hidden min-h-[500px] lg:min-h-[540px] shadow-2xl" id="dest-hero-banner">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=2000&q=80" 
            alt="Gilgit Baltistan Destinations"
            className="w-full h-full object-cover object-center scale-105"
            referrerPolicy="no-referrer"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-slate-950/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-24 sm:pb-28 flex flex-col justify-start items-start h-full text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            <div className="lg:col-span-8 space-y-3 text-left">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#006F3C]/80 border border-[#006F3C]/70 text-white text-xs font-bold backdrop-blur-md shadow-md">
                  <Compass className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="tracking-tight text-white font-medium">Explore Heaven on Earth</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-[1.12] drop-shadow-md">
                Breathtaking Destinations in <br />
                <span className="text-[#006F3C] font-black">Gilgit</span><br />
                <span className="text-[#006F3C] font-black">Baltistan</span>
              </h1>
              <p className="text-slate-100/95 text-sm sm:text-base md:text-lg font-medium max-w-xl leading-relaxed drop-shadow-xs">
                From the turquoise waters of Attabad Lake to the infinite plains of Deosai and ancient royal fort palaces.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Overlapping Search & Filter Console */}
      <section className="-mt-20 sm:-mt-24 relative z-20 w-full" id="dest-search-console">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Search Input with Search Destinations Button */}
            <div className="relative w-full md:w-auto flex-1 flex flex-col sm:flex-row gap-2.5 items-stretch">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search valley, fort, lake or region..."
                  className="w-full h-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#006F3C]"
                />
              </div>
              <button
                type="button"
                className="bg-[#006F3C] hover:bg-[#005C32] text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-sm"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span className="whitespace-nowrap font-extrabold text-[13px]">Search Destinations</span>
              </button>
            </div>

            {/* Region Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {['All', 'Hunza', 'Baltistan', 'Gilgit'].map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setSelectedFilter(reg)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedFilter === reg
                      ? 'bg-[#006F3C] text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {reg} Region
                </button>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 3. DESTINATIONS BENTO CARDS GRID */}
      <section className="space-y-6 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDestinations.map((dest) => (
            <div
              key={dest.id}
              className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="relative h-60 overflow-hidden bg-slate-100">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-[#006F3C] text-white text-[11px] font-extrabold shadow-md">
                    {dest.region}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-200 text-[10px] font-semibold border border-white/20">
                    Elev: {dest.elevation}
                  </span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="text-2xl font-black text-white leading-tight drop-shadow-sm">
                    {dest.name}
                  </h3>
                  <p className="text-xs text-slate-200 font-medium">{dest.title}</p>
                </div>
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <p className="text-slate-600 text-xs leading-relaxed">
                  {dest.description}
                </p>

                {/* Attractions List */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Top Attractions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dest.topAttractions.map((att, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 text-[10px] font-bold">
                        • {att}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="font-bold text-[#006F3C]">{dest.hotelsCount}</span>
                  <span className="font-medium text-slate-400">Best: {dest.bestTime}</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onTriggerSearch) {
                        onTriggerSearch({
                          type: 'hotel',
                          destination: dest.name,
                          dates: '',
                          guests: 2
                        });
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-[#006F3C] hover:bg-[#005C32] text-white text-xs font-extrabold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Search Stays in {dest.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
