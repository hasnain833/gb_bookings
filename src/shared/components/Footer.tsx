import React, { useState } from 'react';

// Set VITE_SUPPORT_PHONE / VITE_SUPPORT_WHATSAPP (digits, e.g. 923001112233) in .env; contact rows stay hidden until then.
const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_PHONE as string | undefined;
const SUPPORT_WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined;
import {
  ShieldCheck,
  Calendar,
  Headset,
  Award,
  Lock,
  MapPin,
  Compass,
  Users,
  Heart,
  Car,
  Sparkles,
  Package,
  Building2,
  Home,
  UserCheck,
  Key,
  BookOpen,
  PhoneCall,
  HelpCircle,
  Send,
  Phone,
  Mail,
  MessageCircle,
  Facebook,
  Instagram,
  Youtube,
  ArrowRight,
  Video
} from 'lucide-react';
import GBLogo from './GBLogo';


interface FooterProps {
  onNavigate?: (view: string, params?: any) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail('');
    }
  };

  const handleNav = (view: string, params?: any) => {
    if (onNavigate) {
      onNavigate(view, params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full font-sans overflow-hidden">
      {/* 1. TOP VALUE PROPS BAR */}
      <div className="bg-[#F3F6F5] border-y border-slate-200/90 py-5 sm:py-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-4 items-center">
            
            {/* Prop 1 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 flex items-center justify-center shrink-0 text-[#006F3C]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">Best Price Guarantee</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">We ensure you get the best prices with no hidden fees.</p>
              </div>
            </div>

            {/* Prop 2 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 flex items-center justify-center shrink-0 text-[#006F3C]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">Free Cancellation</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">Free cancellation until the day before check-in.</p>
              </div>
            </div>

            {/* Prop 3 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 flex items-center justify-center shrink-0 text-[#006F3C]">
                <Headset className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">24/7 Support</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">Our travel experts are always here to help.</p>
              </div>
            </div>

            {/* Prop 4 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 flex items-center justify-center shrink-0 text-[#006F3C]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">Verified Partners</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">Every vendor and listing is reviewed before it goes live.</p>
              </div>
            </div>

            {/* Prop 5 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 flex items-center justify-center shrink-0 text-[#006F3C]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">Secure Booking</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">Your data is safe with our secure system.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 2. MAIN DARK FOOTER */}
      <div className="bg-[#002816] text-slate-300 pt-10 sm:pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 pb-10">
            
            {/* Column 1: Brand Info & Newsletter (Span 3.5) */}
            <div className="lg:col-span-4 space-y-4 pr-0 lg:pr-4">
              <div className="flex flex-col items-start gap-1">
                {/* Logo wrapper for dark mode readability */}
                <div className="inline-flex items-center gap-2">
                  <GBLogo size="md" />
                </div>
                <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mt-1">
                  — Explore Gilgit Baltistan —
                </p>
              </div>

              <p className="text-slate-300/90 text-xs leading-relaxed">
                GBBookings.com is your trusted travel partner for exploring the breathtaking beauty of Gilgit Baltistan. We offer the best hotels, tours, cars and experiences at unbeatable prices.
              </p>

              {/* Social Icons */}
              <div className="flex items-center flex-wrap gap-2 pt-1">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  aria-label="YouTube"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                {SUPPORT_WHATSAPP && (
                  <a
                    href={`https://wa.me/${SUPPORT_WHATSAPP}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
                <a 
                  href="https://tiktok.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  aria-label="TikTok"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                </a>
              </div>

              {/* Newsletter Block */}
              <div className="pt-3 space-y-2">
                <h4 className="text-white font-semibold text-sm">Subscribe to Our Newsletter</h4>
                <p className="text-slate-400 text-xs leading-snug">
                  Get the best travel deals, tips & inspiration straight to your inbox.
                </p>
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 pt-1 w-full">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="bg-white/5 border border-white/15 text-white text-xs px-3.5 py-2.5 rounded-xl sm:rounded-r-none sm:rounded-l-xl w-full min-h-[44px] focus:outline-none focus:border-emerald-400 placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    className="bg-[#006F3C] hover:bg-[#005C32] text-white text-xs font-bold px-4 py-2.5 rounded-xl sm:rounded-l-none sm:rounded-r-xl min-h-[44px] flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <span>Subscribe</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                {subscribed && (
                  <p className="text-emerald-400 text-[11px] font-semibold pt-1">
                    ✓ Thank you for subscribing! Check your inbox soon.
                  </p>
                )}
              </div>
            </div>

            {/* Column 2: Top Destinations (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-white font-semibold text-sm">Top Destinations</h4>
              <ul className="space-y-2 text-xs">
                {[
                  { label: 'Skardu', name: 'Skardu' },
                  { label: 'Hunza Valley', name: 'Hunza Valley' },
                  { label: 'Gilgit', name: 'Gilgit' },
                  { label: 'Shigar Valley', name: 'Shigar Valley' },
                  { label: 'Deosai Plains', name: 'Deosai Plains' },
                  { label: 'Fairy Meadows', name: 'Fairy Meadows' },
                  { label: 'Naltar Valley', name: 'Naltar Valley' },
                  { label: 'Attabad Lake', name: 'Attabad Lake' }
                ].map((item, idx) => (
                  <li key={idx}>
                    <button 
                      onClick={() => handleNav('destinations', { destination: item.name })}
                      className="flex items-center gap-2 hover:text-white transition-colors text-left text-slate-300"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleNav('destinations')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center gap-1 pt-1 transition-colors"
              >
                <span>View All Destinations</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Column 3: Tours & Packages (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-white font-semibold text-sm">Tours & Packages</h4>
              <ul className="space-y-2 text-xs">
                {[
                  { label: 'Adventure Tours', icon: Compass },
                  { label: 'Family Tours', icon: Users },
                  { label: 'Honeymoon Packages', icon: Heart },
                  { label: 'Jeep Safari Tours', icon: Car },
                  { label: 'Trekking Tours', icon: Compass },
                  { label: 'Camping Tours', icon: Sparkles },
                  { label: 'Luxury Tours', icon: Sparkles },
                  { label: 'Custom Tours', icon: Package }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <li key={idx}>
                      <button 
                        onClick={() => handleNav('tours')}
                        className="flex items-center gap-2 hover:text-white transition-colors text-left text-slate-300"
                      >
                        <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button 
                onClick={() => handleNav('tours')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center gap-1 pt-1 transition-colors"
              >
                <span>View All Packages</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Column 4: Hotels (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-white font-semibold text-sm">Hotels</h4>
              <ul className="space-y-2 text-xs">
                {[
                  { label: 'Hotels in Skardu', icon: Building2 },
                  { label: 'Hotels in Hunza', icon: Building2 },
                  { label: 'Hotels in Gilgit', icon: Building2 },
                  { label: 'Luxury Hotels', icon: Sparkles },
                  { label: 'Budget Hotels', icon: Building2 },
                  { label: 'Resorts', icon: Building2 },
                  { label: 'Guest Houses', icon: Home },
                  { label: 'Homestays', icon: Home }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <li key={idx}>
                      <button 
                        onClick={() => handleNav('hotels')}
                        className="flex items-center gap-2 hover:text-white transition-colors text-left text-slate-300"
                      >
                        <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button 
                onClick={() => handleNav('hotels')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center gap-1 pt-1 transition-colors"
              >
                <span>View All Hotels</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Column 5: Cars & More (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-white font-semibold text-sm">Cars & More</h4>
              <ul className="space-y-2 text-xs">
                {[
                  { label: 'Car Rental in Skardu', view: 'cars', icon: Car },
                  { label: 'Car Rental in Hunza', view: 'cars', icon: Car },
                  { label: 'Car Rental in Gilgit', view: 'cars', icon: Car },
                  { label: 'SUVs & 4x4', view: 'cars', icon: Car },
                  { label: 'With Driver', view: 'cars', icon: UserCheck },
                  { label: 'Self Drive', view: 'cars', icon: Key },
                  { label: 'Travel Guide', view: 'support', icon: BookOpen },
                  { label: 'About Us', view: 'support', icon: Users },
                  { label: 'Contact Us', view: 'support', icon: PhoneCall },
                  { label: 'FAQs', view: 'support', icon: HelpCircle }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <li key={idx}>
                      <button 
                        onClick={() => handleNav(item.view)}
                        className="flex items-center gap-2 hover:text-white transition-colors text-left text-slate-300"
                      >
                        <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button 
                onClick={() => handleNav('cars')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center gap-1 pt-1 transition-colors"
              >
                <span>View All Cars</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

          </div>

          {/* 3. BOTTOM MULTI-WIDGET ROW - SINGLE BOX WITH DIVIDERS */}
          <div className="border-t border-white/10 pt-8 mt-4">
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
                
                {/* Widget 1: Payment */}
                <div className="flex flex-col space-y-2 text-xs pb-6 lg:pb-0 lg:pr-6">
                  <h5 className="text-white font-semibold text-xs uppercase tracking-wider">Payment</h5>
                  <p className="text-slate-300">Pay at the property when you check in. Online payment is coming soon.</p>
                </div>

                {/* Widget 2: Contact Us */}
                <div className="flex flex-col space-y-2 text-xs py-6 lg:py-0 lg:px-6">
                  <h5 className="text-white font-semibold text-xs uppercase tracking-wider">Contact Us</h5>
                  <div className="space-y-1.5 text-slate-300">
                    {SUPPORT_PHONE && (
                      <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-white">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-semibold">{SUPPORT_PHONE}</span>
                      </a>
                    )}
                    <a href="mailto:info@gbbookings.com" className="flex items-center gap-2 hover:text-white">
                      <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>info@gbbookings.com</span>
                    </a>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Skardu, Gilgit Baltistan, Pakistan</span>
                    </div>
                  </div>
                </div>

                {/* Widget 3: Help */}
                <div className="flex flex-col space-y-2 pt-6 lg:pt-0 lg:pl-6">
                  <div>
                    <h5 className="text-white font-semibold text-xs uppercase tracking-wider">Need Help?</h5>
                    <p className="text-slate-400 text-[11px] mt-0.5">Our team can help you plan your trip or sort out a booking.</p>
                  </div>
                  {SUPPORT_WHATSAPP && (
                    <a
                      href={`https://wa.me/${SUPPORT_WHATSAPP}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-[#006F3C] hover:bg-[#005C32] text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm mt-1"
                    >
                      <MessageCircle className="w-4 h-4 text-white fill-white/20" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* 4. COPYRIGHT & FOOTER BOTTOM BAR */}
          <div className="border-t border-white/10 mt-8 pt-6 relative overflow-hidden">
            {/* Background Mountain Contour Graphic */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400 relative z-10 text-left">
              <p className="text-left">
                © 2026 GBBookings.com - All Rights Reserved.
              </p>
              <div className="flex items-center gap-1 text-slate-300 font-medium">
                <span>Made with</span>
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline mx-0.5" />
                <span>for travelers</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
