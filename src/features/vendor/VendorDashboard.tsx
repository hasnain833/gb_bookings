import React, { useState, useEffect } from 'react';
import { Listing, handleImageError } from '../../types';
import { DashboardSkeleton } from '../../shared/components/SkeletonLoader';
import { DollarSign, Percent, BarChart3, Star, Sparkles, FolderPlus, ToggleLeft, ToggleRight, Trash, Send, Plus, Upload } from 'lucide-react';
import { api } from '../../shared/api/api';

interface VendorDashboardProps {
  setView: (v: string) => void;
}

export default function VendorDashboard({ setView }: VendorDashboardProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'analytics' | 'add-listing'>('listings');

  // Add Listing Form States
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'hotel' | 'car' | 'tour'>('hotel');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const fetchVendorListings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/listings');
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        setListings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorListings();
  }, []);

  // Submit New Listing
  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !price || !location || !image) return;

    setFormMessage(null);
    try {
      const newListing = await api.createListing({
        type,
        title,
        location,
        price: Number(price),
        image,
        images: [image],
        description,
      });

      setListings((current) => [newListing, ...current]);
      setFormMessage('Listing submitted successfully.');
      
      // Clear
      setTitle('');
      setDescription('');
      setPrice('');
      setImage('');
      setLocation('');
      setActiveTab('listings');
    } catch (reason) {
      setFormMessage(reason instanceof Error ? reason.message : 'Unable to submit this listing.');
    }
  };

  // Toggle Featured State
  const handleToggleFeatured = async (id: string) => {
    const listing = listings.find((item) => item.id === id);
    if (!listing) return;
    try {
      const updated = await api.updateListing(id, { featured: !listing.featured });
      setListings((current) => current.map((item) => item.id === id ? updated : item));
    } catch (reason) {
      setFormMessage(reason instanceof Error ? reason.message : 'Unable to update this listing.');
    }
  };

  return (
    <div id="vendor-dashboard-view" className="space-y-8 pb-16">
      
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="vendor-header">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 uppercase tracking-tight">Vendor Console</h2>
          <p className="text-xs sm:text-sm text-slate-500">Manage your luxury rooms, vehicle fleets, and private excursions.</p>
        </div>

        <div className="flex space-x-3">
          <button
            id="btn-vendor-add-shortcut"
            onClick={() => setActiveTab('add-listing')}
            className="w-full sm:w-auto bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-2.5 px-5 rounded-lg text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs uppercase tracking-wider"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Deploy Listing</span>
          </button>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" id="vendor-analytics-metrics">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex items-center space-x-3 sm:space-x-4 shadow-xs">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 shrink-0">
            <DollarSign className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Gross Revenue</span>
            <span className="text-sm sm:text-base font-bold text-slate-800 mt-0.5 block font-mono">Unavailable</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex items-center space-x-3 sm:space-x-4 shadow-xs">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100 shrink-0">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Reservations</span>
            <span className="text-sm sm:text-base font-bold text-slate-800 mt-0.5 block font-mono">Unavailable</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex items-center space-x-3 sm:space-x-4 shadow-xs">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100 shrink-0">
            <Star className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Reviews average</span>
            <span className="text-sm sm:text-base font-bold text-slate-800 mt-0.5 block font-mono">Unavailable</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 flex items-center space-x-3 sm:space-x-4 shadow-xs">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-purple-50 rounded-lg flex items-center justify-center border border-purple-100 shrink-0">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Active Inventories</span>
            <span className="text-sm sm:text-base font-bold text-slate-800 mt-0.5 block font-mono">{listings.length} Active</span>
          </div>
        </div>
      </div>

      {/* Tab Controller bar */}
      <div className="flex border-b border-slate-200 pb-1.5 space-x-3 sm:space-x-6 overflow-x-auto touch-scroll-x scrollbar-none" id="vendor-tabs-bar">
        {[
          { id: 'listings', label: 'My Listings' },
          { id: 'analytics', label: 'Earnings Reports' },
          { id: 'add-listing', label: 'Deploy New Property' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-vend-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`min-h-[44px] px-2 sm:px-3 pb-3 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer relative whitespace-nowrap shrink-0 ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-[#0F172A]'
              }`}
            >
              <span>{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div id="vendor-active-pane">
        
        {/* TAB 1: listings Grid manager */}
        {activeTab === 'listings' && (
          <div className="space-y-4 animate-fadeIn" id="vend-listings-pane">
            {loading ? (
              <DashboardSkeleton />
            ) : (
              <div className="space-y-4">
                {/* Mobile View: Responsive Cards for < md */}
                <div className="block md:hidden space-y-3" id="vend-listings-mobile-cards">
                  {listings.map((l) => (
                    <div
                      key={l.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
                      id={`vend-listing-card-${l.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={l.image}
                          alt=""
                          className="w-14 h-12 object-cover rounded-xl shrink-0"
                          referrerPolicy="no-referrer"
                          onError={handleImageError}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{l.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="uppercase font-bold text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                              {l.type}
                            </span>
                            <span className="text-slate-500 text-[11px] truncate">{l.location.split(',')[0]}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Base Rate</span>
                          <span className="text-xs sm:text-sm font-mono font-bold text-slate-800">PKR {l.price.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-slate-500">
                            {l.featured ? 'Featured' : 'Standard'}
                          </span>
                          <button
                            id={`btn-toggle-featured-m-${l.id}`}
                            onClick={() => handleToggleFeatured(l.id)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-900 cursor-pointer"
                            aria-label="Toggle featured state"
                          >
                            {l.featured ? (
                              <ToggleRight className="w-7 h-7 text-indigo-600" />
                            ) : (
                              <ToggleLeft className="w-7 h-7 text-slate-300" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop & Tablet View: Full Table for md+ */}
                <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-xs w-full max-w-full">
                  <table className="w-full min-w-[620px] text-left text-xs text-slate-600" id="vend-listings-table">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-400 text-[10px] tracking-wider">
                      <tr>
                        <th className="p-4">Property</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Base Rate (PKR)</th>
                        <th className="p-4">Featured Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {listings.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50 transition-colors" id={`vend-listing-row-${l.id}`}>
                          <td className="p-4 flex items-center space-x-3 text-left">
                            <img src={l.image} alt="" className="w-10 h-8 object-cover rounded-lg shrink-0" referrerPolicy="no-referrer" onError={handleImageError} />
                            <span className="font-bold text-slate-800 text-left truncate max-w-[180px] lg:max-w-xs">{l.title}</span>
                          </td>
                          <td className="p-4 uppercase font-bold text-[10px] text-indigo-600">{l.type}</td>
                          <td className="p-4 text-slate-500 font-medium">{l.location.split(',')[0]}</td>
                          <td className="p-4 font-mono font-bold text-slate-800">PKR {l.price.toLocaleString()}</td>
                          <td className="p-4">
                            <button
                              id={`btn-toggle-featured-${l.id}`}
                              onClick={() => handleToggleFeatured(l.id)}
                              className="text-slate-400 hover:text-slate-900 cursor-pointer min-h-[36px] flex items-center"
                              aria-label="Toggle featured"
                            >
                              {l.featured ? (
                                <ToggleRight className="w-6 h-6 text-indigo-600" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-slate-300" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Earnings Reports */}
        {activeTab === 'analytics' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs animate-fadeIn" id="vend-analytics-pane">
            <BarChart3 className="mx-auto h-9 w-9 text-slate-400" />
            <h3 className="mt-3 text-base font-bold text-slate-900">Analytics are not available yet</h3>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">Revenue, reservations, occupancy, and payout reports will appear here when the vendor analytics API is connected.</p>
          </div>
        )}

        {/* TAB 3: Deploy New Listing Wizard */}
        {activeTab === 'add-listing' && (
          <form onSubmit={handleAddListing} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-xs animate-fadeIn" id="form-deploy-new-listing">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] uppercase tracking-tight">Deploy Premium Property</h3>
              <p className="text-xs text-slate-500 mt-1">Deploy a new hotel, vehicle fleet, or tour package into the Pakistan active catalog.</p>
            </div>

            {formMessage && (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700" role="status">
                {formMessage}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Property Category</label>
                <select
                  id="deploy-type"
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white cursor-pointer"
                >
                  <option value="hotel">🏨 Premium Hotel / Resort</option>
                  <option value="car">🚘 Luxury Fleet Vehicle</option>
                  <option value="tour">🏔️ Guided Tour Package</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Listing / Commercial Name</label>
                <input
                  type="text"
                  required
                  id="deploy-title"
                  placeholder="e.g. Serena Heritage Suite Skardu"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white"
                />
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rate Price (PKR per night/day/tour)</label>
                <input
                  type="number"
                  required
                  id="deploy-price"
                  placeholder="35000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white font-mono"
                />
              </div>

              {/* Location Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Geographic Sector / Location</label>
                <select
                  id="deploy-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white cursor-pointer"
                >
                  <option value="" disabled>Select a location</option>
                  <option value="Attabad Lake, Hunza Valley">Hunza Valley (Attabad Lake)</option>
                  <option value="Lower Kachura Lake, Skardu">Skardu Region</option>
                  <option value="Kalam Valley, Swat">Swat Valley (Kalam)</option>
                  <option value="Margalla Sector G-5, Islamabad">Islamabad (Margalla)</option>
                  <option value="Walled City Old Sector, Lahore">Lahore Heritage</option>
                </select>
              </div>
            </div>

            {/* Photo Link */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Property Thumbnail URL</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  id="deploy-image"
                  placeholder="https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white pr-11"
                />
                <Upload className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Marketing Description</label>
              <textarea
                required
                id="deploy-desc"
                rows={4}
                placeholder="Details of luxury architecture, amenities, peak mountain views, safety profiles, or inclusions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              id="btn-deploy-new-listing"
              className="w-full min-h-[46px] bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl shadow-xs transition-all text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Listing to Marketplace</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
