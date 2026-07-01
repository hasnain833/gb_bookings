import React, { useState } from 'react';
import { Bot, Sparkles, MapPin, DollarSign, Calendar, Users, Send, CheckCircle2, Map } from 'lucide-react';
import { INITIAL_LISTINGS } from '../data';
import { Listing, handleImageError } from '../types';
import { useLanguage } from '../LanguageContext';

interface AiPlannerProps {
  setView: (v: string) => void;
  onSelectListing: (listing: Listing) => void;
}

export default function AiPlanner({ setView, onSelectListing }: AiPlannerProps) {
  const { language, t, isRtl } = useLanguage();
  const [destination, setDestination] = useState('Hunza Valley');
  const [budgetTier, setBudgetTier] = useState('Elite Luxury');
  const [budgetAmount, setBudgetAmount] = useState('150000');
  const [duration, setDuration] = useState('5');
  const [travelers, setTravelers] = useState('2');
  const [interests, setInterests] = useState('Hiking, Lake views, Historical forts, Local Balti cuisine');
  
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [itinerary, setItinerary] = useState<string | null>(null);

  // Trigger Gemini API via Express Server
  const handleGenerateItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setItinerary(null);

    const loaderMessages = [
      'Establishing connection with GBBookings AI Node...',
      'Analyzing real-time road accessibility in Gilgit-Baltistan...',
      'Evaluating premium hotel vacancies in Karimabad...',
      'Mapping fuel costs and mountain Prado routing schedules...',
      'Translating regional Balti & Hunza hospitality customs...',
      'Finalizing pristine, luxury itinerary format...'
    ];

    // Shifting messages cycle
    let msgIndex = 0;
    setLoadingMsg(loaderMessages[0]);
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % loaderMessages.length;
      setLoadingMsg(loaderMessages[msgIndex]);
    }, 1500);

    try {
      const res = await fetch('/api/ai-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          budget: `${budgetAmount} (${budgetTier})`,
          duration,
          travelers,
          interests
        })
      });

      clearInterval(msgInterval);

      if (res.ok) {
        const data = await res.json();
        setItinerary(data.itinerary);
      } else {
        const errData = await res.json();
        setItinerary(`### Error\n\n${errData.error || 'Failed to call Gemini API server.'}`);
      }
    } catch (err: any) {
      clearInterval(msgInterval);
      setItinerary(`### Connection Error\n\nFailed to establish connection to full-stack planning server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Simple and highly elegant markdown formatter
  const renderFormattedMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('###')) {
        return <h4 key={i} className="text-base font-bold text-indigo-600 mt-6 mb-2 uppercase tracking-wide">{trimmed.replace('###', '')}</h4>;
      }
      if (trimmed.startsWith('##')) {
        return <h3 key={i} className="text-lg font-bold text-[#0F172A] border-b border-slate-100 pb-2 mt-8 mb-4 uppercase tracking-tight">{trimmed.replace('##', '')}</h3>;
      }
      if (trimmed.startsWith('#')) {
        return <h2 key={i} className="text-xl font-bold text-[#0F172A] mt-10 mb-5 uppercase tracking-tight">{trimmed.replace('#', '')}</h2>;
      }

      // Bullets
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const cleanText = trimmed.substring(1).trim();
        // Check for bold parts **text**
        return (
          <li key={i} className="text-xs md:text-sm text-slate-600 ml-4 list-disc marker:text-indigo-600 mb-2 leading-relaxed font-medium">
            {formatBold(cleanText)}
          </li>
        );
      }

      // Normal text with potential bold formatting
      if (trimmed === '') return <div key={i} className="h-2" />;
      return <p key={i} className="text-xs md:text-sm text-slate-600 leading-relaxed mb-3.5 font-medium">{formatBold(trimmed)}</p>;
    });
  };

  // Helper to replace **text** with strong elements
  const formatBold = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    if (parts.length === 1) return text;
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-indigo-600 bg-indigo-50/50 px-1 py-0.5 rounded border border-indigo-100/30">{part}</strong>;
      }
      return part;
    });
  };

  // Find properties in our database that match destination to show as recommendations
  const getRecommendedListings = () => {
    const term = destination.toLowerCase().split(' ')[0];
    return INITIAL_LISTINGS.filter(l => 
      l.location.toLowerCase().includes(term) || 
      l.title.toLowerCase().includes(term)
    );
  };

  const recommendations = getRecommendedListings();

  return (
    <div id="ai-planner-view" className="space-y-8 pb-16">
      
      {/* Intro Header */}
      <div className="flex items-center space-x-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
          <Bot className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#0F172A] uppercase tracking-tight flex items-center gap-1.5">
            GBBookings AI Companion <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-600 font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active Gemini</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Let our localized travel intelligence build a luxury travel map of Pakistan in seconds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="ai-planner-main-grid">
        {/* Left Form Panel */}
        <aside className="lg:col-span-4" id="ai-planner-form-sidebar">
          <form onSubmit={handleGenerateItinerary} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs" id="form-itinerary-inputs">
            <h3 className="text-xs font-bold uppercase text-[#0F172A] border-b border-slate-100 pb-2.5 flex items-center gap-1.5 tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Specify Trip Vectors
            </h3>

            {/* Destination Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Sector</label>
              <select
                id="ai-dest"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white"
              >
                <option value="Hunza Valley">Hunza Valley (Lakes & Peaks)</option>
                <option value="Skardu Plains">Skardu & Deosai plains</option>
                <option value="Swat Valley">Swat & Kalam Alpine</option>
                <option value="Islamabad Capital">Islamabad & Margalla Hills</option>
                <option value="Lahore Walled City">Lahore Cultural Heritage</option>
              </select>
            </div>

            {/* Budget Tier Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Budget Mode</label>
              <div className="grid grid-cols-3 gap-1.5" id="ai-budget-tiers">
                {['Economy', 'Business', 'Elite Luxury'].map((b) => (
                  <button
                    type="button"
                    key={b}
                    id={`btn-ai-budget-${b}`}
                    onClick={() => {
                      setBudgetTier(b);
                      setBudgetAmount(b === 'Economy' ? '45000' : b === 'Business' ? '90000' : '180000');
                    }}
                    className={`py-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      budgetTier === b
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Price helper input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Budget (PKR)</label>
              <div className="relative">
                <input
                  type="number"
                  id="ai-budget-amount"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white font-mono"
                />
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Duration and Travelers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Duration (Days)</label>
                <select
                  id="ai-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white"
                >
                  {[3, 4, 5, 6, 7, 10].map(d => (
                    <option key={d} value={d}>{d} Days</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Travelers</label>
                <select
                  id="ai-travelers"
                  value={travelers}
                  onChange={(e) => setTravelers(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white"
                >
                  {[1, 2, 4, 6, 8, 12].map(t => (
                    <option key={t} value={t}>{t} {t === 1 ? 'Person' : 'People'}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom preferences interests text */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Personalized Interests</label>
              <textarea
                id="ai-interests"
                rows={3}
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="e.g. Stargazing in dunes, historic forts walk, balti apricot soup, shopping authentic gems..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0F172A] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              id="btn-ai-generate-blueprint"
              disabled={loading}
              className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-lg shadow-xs transition-all text-xs flex items-center justify-center space-x-1.5 cursor-pointer uppercase tracking-wider"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.25]" />
              <span>{loading ? 'Synthesizing...' : 'Generate My Dream Itinerary'}</span>
            </button>
          </form>
        </aside>

        {/* Right Output Panel */}
        <main className="lg:col-span-8 flex flex-col justify-between" id="ai-planner-output-panel">
          {/* Output Content container */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex-1 shadow-xs overflow-y-auto max-h-[580px]" id="itinerary-output-box">
            {loading ? (
              // AI processing state
              <div className="h-full flex flex-col items-center justify-center space-y-6 py-20 text-center animate-pulse" id="itinerary-loading-spinner">
                <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#0F172A] uppercase tracking-tight">Simulating Itinerary Coordinates</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{loadingMsg}</p>
                </div>
              </div>
            ) : itinerary ? (
              // Formatted markdown result
              <div className="space-y-4 animate-fadeIn text-slate-600 text-sm leading-relaxed" id="itinerary-formatted-result">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-lg mb-6 max-w-max uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Itinerary Compiled by Gemini AI Flash</span>
                </div>
                {renderFormattedMarkdown(itinerary)}
              </div>
            ) : (
              // Initial Empty state
              <div className="h-full flex flex-col items-center justify-center text-center py-24 space-y-4" id="itinerary-empty-state">
                <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200 shadow-xs">
                  <Bot className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0F172A] uppercase tracking-tight">Your Personal Travel Blueprint</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed font-medium">
                    Specify your destination and budget on the left, then click Generate to create an elite, day-by-day travel plan.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Connected bookings recommendations loop */}
          {itinerary && recommendations.length > 0 && (
            <div className="mt-6 space-y-3 animate-fadeIn" id="itinerary-listings-recommendations text-left">
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider text-left">
                {isRtl 
                  ? `${destination.split(' ')[0]} میں تجویز کردہ مقامات بک کریں`
                  : `Book recommended spaces in ${destination.split(' ')[0]}`}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="recommendations-row">
                {recommendations.slice(0, 2).map((l) => (
                  <div key={l.id} className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between gap-4 shadow-xs" id={`recom-card-${l.id}`}>
                    <div className="flex items-center space-x-3 text-left">
                      <img src={l.image} alt="" className="w-14 h-11 object-cover rounded-lg shrink-0 border border-slate-100" referrerPolicy="no-referrer" onError={handleImageError} />
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">{l.title}</h5>
                        <p className="text-[10px] text-indigo-600 font-bold mt-0.5">PKR {l.price.toLocaleString()}</p>
                      </div>
                    </div>
                    <button
                      id={`btn-book-recom-${l.id}`}
                      onClick={() => onSelectListing(l)}
                      className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer uppercase tracking-wider shadow-xs"
                    >
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
