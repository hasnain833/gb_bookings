import React, { useState } from 'react';
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
  Plane, 
  BookOpen, 
  FileText, 
  Globe, 
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
              <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center shrink-0 text-[#006F3C]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">Best Price Guarantee</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">We ensure you get the best prices with no hidden fees.</p>
              </div>
            </div>

            {/* Prop 2 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center shrink-0 text-[#006F3C]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">Free Cancellation</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">Cancel up to 24 hours before your trip.</p>
              </div>
            </div>

            {/* Prop 3 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center shrink-0 text-[#006F3C]">
                <Headset className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">24/7 Support</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">Our travel experts are always here to help.</p>
              </div>
            </div>

            {/* Prop 4 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center shrink-0 text-[#006F3C]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">Trusted by Travelers</h4>
                <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">Thousands of happy travelers trust GBBookings.com</p>
              </div>
            </div>

            {/* Prop 5 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 border border-[#006F3C]/20 flex items-center justify-center shrink-0 text-[#006F3C]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">Secure Booking</h4>
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
                  className="w-10 h-10 rounded-full bg-[#003D21] border border-[#006F3C] hover:bg-[#006F3C] flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full bg-[#003D21] border border-[#006F3C] hover:bg-[#006F3C] flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a 
                  href="https://youtube.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  aria-label="YouTube"
                  className="w-10 h-10 rounded-full bg-[#003D21] border border-[#006F3C] hover:bg-[#006F3C] flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a 
                  href="https://wa.me/923001234567" 
                  target="_blank" 
                  rel="noreferrer" 
                  aria-label="WhatsApp"
                  className="w-10 h-10 rounded-full bg-[#003D21] border border-[#006F3C] hover:bg-[#006F3C] flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a 
                  href="https://tiktok.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  aria-label="TikTok"
                  className="w-10 h-10 rounded-full bg-[#003D21] border border-[#006F3C] hover:bg-[#006F3C] flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                </a>
              </div>

              {/* Newsletter Block */}
              <div className="pt-3 space-y-2">
                <h4 className="text-white font-extrabold text-sm">Subscribe to Our Newsletter</h4>
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
                    className="bg-[#003D21] border border-[#006F3C] text-white text-xs px-3.5 py-2.5 rounded-xl sm:rounded-r-none sm:rounded-l-xl w-full min-h-[44px] focus:outline-none focus:border-[#006F3C] placeholder-slate-400"
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
                  <p className="text-[#006F3C] text-[11px] font-semibold pt-1">
                    ✓ Thank you for subscribing! Check your inbox soon.
                  </p>
                )}
              </div>
            </div>

            {/* Column 2: Top Destinations (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-white font-extrabold text-sm border-b border-[#006F3C] pb-2">Top Destinations</h4>
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
                      className="flex items-center gap-2 hover:text-[#006F3C] transition-colors text-left text-slate-300"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#006F3C] shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleNav('destinations')}
                className="text-[#006F3C] hover:text-[#008247] font-bold text-xs flex items-center gap-1 pt-1 transition-colors"
              >
                <span>View All Destinations</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Column 3: Tours & Packages (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-white font-extrabold text-sm border-b border-[#006F3C] pb-2">Tours & Packages</h4>
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
                        className="flex items-center gap-2 hover:text-[#006F3C] transition-colors text-left text-slate-300"
                      >
                        <Icon className="w-3.5 h-3.5 text-[#006F3C] shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button 
                onClick={() => handleNav('tours')}
                className="text-[#006F3C] hover:text-[#008247] font-bold text-xs flex items-center gap-1 pt-1 transition-colors"
              >
                <span>View All Packages</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Column 4: Hotels (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-white font-extrabold text-sm border-b border-[#006F3C] pb-2">Hotels</h4>
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
                        className="flex items-center gap-2 hover:text-[#006F3C] transition-colors text-left text-slate-300"
                      >
                        <Icon className="w-3.5 h-3.5 text-[#006F3C] shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button 
                onClick={() => handleNav('hotels')}
                className="text-[#006F3C] hover:text-[#008247] font-bold text-xs flex items-center gap-1 pt-1 transition-colors"
              >
                <span>View All Hotels</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Column 5: Cars & More (Span 2) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-white font-extrabold text-sm border-b border-[#006F3C] pb-2">Cars & More</h4>
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
                        className="flex items-center gap-2 hover:text-[#006F3C] transition-colors text-left text-slate-300"
                      >
                        <Icon className="w-3.5 h-3.5 text-[#006F3C] shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button 
                onClick={() => handleNav('cars')}
                className="text-[#006F3C] hover:text-[#008247] font-bold text-xs flex items-center gap-1 pt-1 transition-colors"
              >
                <span>View All Cars</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

          </div>

          {/* 3. BOTTOM MULTI-WIDGET ROW - SINGLE BOX WITH DIVIDERS */}
          <div className="border-t border-[#006F3C] pt-8 mt-4">
            <div className="bg-[#003D21]/60 border border-[#006F3C] rounded-2xl p-5 sm:p-6 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#006F3C]">
                
                {/* Widget 1: We Accept */}
                <div className="flex flex-col justify-between space-y-3 pb-6 lg:pb-0 lg:pr-6">
                  <h5 className="text-white font-extrabold text-xs uppercase tracking-wider">We Accept</h5>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* VISA */}
                    <div className="bg-white px-2.5 py-1.5 rounded-md border border-slate-200 flex items-center justify-center shadow-2xs">
                      <span className="font-extrabold text-xs italic tracking-tighter text-[#1A1F71]">VISA</span>
                    </div>
                    {/* Mastercard */}
                    <div className="bg-white px-2.5 py-1.5 rounded-md border border-slate-200 flex items-center justify-center gap-0.5 shadow-2xs">
                      <div className="w-3 h-3 rounded-full bg-[#EB001B]" />
                      <div className="w-3 h-3 rounded-full bg-[#F79E1B] -ml-1.5 opacity-90" />
                    </div>
                    {/* UBL */}
                    <div className="bg-white px-2.5 py-1.5 rounded-md border border-slate-200 flex items-center justify-center shadow-2xs">
                      <span className="font-black text-[10px] text-[#0055A5] uppercase tracking-tighter">UBL</span>
                    </div>
                    {/* Easypaisa */}
                    <div className="bg-[#00AA4F] px-2.5 py-1.5 rounded-md text-white flex items-center justify-center shadow-2xs">
                      <span className="font-black text-[10px] lowercase">easypaisa</span>
                    </div>
                    {/* JazzCash */}
                    <div className="bg-[#800000] px-2.5 py-1.5 rounded-md text-amber-400 flex items-center justify-center shadow-2xs">
                      <span className="font-black text-[10px] tracking-tight">Jazz Cash</span>
                    </div>
                  </div>
                </div>

                {/* Widget 2: Download Our App */}
                <div className="flex flex-col justify-between space-y-2 py-6 lg:py-0 lg:px-6">
                  <div>
                    <h5 className="text-white font-extrabold text-xs uppercase tracking-wider">Download Our App</h5>
                    <p className="text-slate-400 text-[11px] mt-0.5">Book on the go and get exclusive app-only deals!</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button 
                      type="button"
                      onClick={() => alert('GBBookings iOS App coming soon to App Store!')}
                      className="bg-black border border-white/20 hover:border-white/40 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                    >
                      <AppleIcon className="w-4 h-4 fill-white shrink-0" />
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase block leading-none">Download on the</span>
                        <span className="text-[10px] font-bold block leading-tight">App Store</span>
                      </div>
                    </button>
                    <button 
                      type="button"
                      onClick={() => alert('GBBookings Android App coming soon to Google Play!')}
                      className="bg-black border border-white/20 hover:border-white/40 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-left"
                    >
                      <PlayStoreIcon className="w-4 h-4 shrink-0" />
                      <div>
                        <span className="text-[8px] text-slate-400 uppercase block leading-none">GET IT ON</span>
                        <span className="text-[10px] font-bold block leading-tight">Google Play</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Widget 3: Contact Us */}
                <div className="flex flex-col justify-between space-y-2 text-xs py-6 lg:py-0 lg:px-6">
                  <h5 className="text-white font-extrabold text-xs uppercase tracking-wider">Contact Us</h5>
                  <div className="space-y-1.5 text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#006F3C] shrink-0" />
                      <span className="font-semibold">+92 300 1234567</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#006F3C] shrink-0" />
                      <span>info@gbbookings.com</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#006F3C] shrink-0 mt-0.5" />
                      <span>Skardu, Gilgit Baltistan, Pakistan</span>
                    </div>
                  </div>
                </div>

                {/* Widget 4: We're Here 24/7 */}
                <div className="flex flex-col justify-between space-y-2 pt-6 lg:pt-0 lg:pl-6">
                  <div>
                    <h5 className="text-white font-extrabold text-xs uppercase tracking-wider">We're Here 24/7</h5>
                    <p className="text-slate-400 text-[11px] mt-0.5">Our team is always ready to help you plan your perfect trip.</p>
                  </div>
                  <a
                    href="https://wa.me/923001234567"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-[#006F3C] hover:bg-[#005C32] border border-[#006F3C]/50 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm mt-1"
                  >
                    <MessageCircle className="w-4 h-4 text-white fill-white/20" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>

              </div>
            </div>
          </div>

          {/* 4. COPYRIGHT & FOOTER BOTTOM BAR */}
          <div className="border-t border-[#005C32]/80 mt-8 pt-6 relative overflow-hidden">
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

{/* Helper Apple SVG Icon */}
function AppleIcon({ className = "w-4 h-4 fill-white" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 170 170">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.14-1.9-14.4-6.08-3.38-2.67-7.3-7.33-11.77-13.98-6.19-9.12-11.02-19.52-14.48-31.18-3.46-11.66-5.19-22.77-5.19-33.34 0-14.04 3.52-25.59 10.56-34.65 7.03-9.06 15.82-13.68 26.36-13.87 4.7 0 9.87 1.22 15.52 3.66 5.65 2.44 9.54 3.66 11.66 3.66 1.83 0 5.86-1.29 12.09-3.87 6.22-2.58 11.51-3.79 15.87-3.63 11.75.52 20.89 4.77 27.42 12.75-10.42 6.32-15.5 15.07-15.24 26.25.26 8.7 3.61 15.93 10.05 21.68 6.44 5.75 14.12 9.07 23.04 9.96-2.58 7.57-5.88 15.07-9.9 22.49zM119.22 31.06c0-7.32 2.65-14.28 7.95-20.88 5.3-6.6 11.96-10.18 19.98-10.74.13.92.2 1.84.2 2.76 0 7.18-2.73 14.22-8.19 21.12-5.46 6.9-12.21 10.63-20.25 11.19-.13-1.12-.2-2.27-.2-3.45z" />
    </svg>
  );
}

{/* Helper Play Store SVG Icon */}
function PlayStoreIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512">
      <path fill="#41A5EE" d="M325.8 243.7L73.9 397.4c-8.9 5.2-19.9 5.2-28.8 0C36.2 392.2 30 381.5 30 371.1V140.9c0-10.4 6.2-21.1 15.1-26.3 8.9-5.2 19.9-5.2 28.8 0l251.9 129.1z"/>
      <path fill="#22D2A0" d="M325.8 243.7L422.3 293c12 6.2 19.7 18.6 19.7 32.1s-7.7 25.9-19.7 32.1l-96.5 49.3L273 342.1l52.8-98.4z"/>
      <path fill="#FF3A44" d="M325.8 243.7l-52.8-98.4 52.8-64.4 96.5 49.3c12 6.2 19.7 18.6 19.7 32.1s-7.7 25.9-19.7 32.1l-96.5 49.3z"/>
      <path fill="#FFC700" d="M273 145.3l52.8 98.4-52.8 98.4L73.9 114.6l199.1 30.7z"/>
    </svg>
  );
}
