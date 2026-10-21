import React, { useState } from "react";
import {
  ArrowRight, Award, BookOpen, Building2, Calendar, Car, Compass, Facebook, Headset, Heart, HelpCircle, Home, Instagram, Key,
  Lock, Mail, MapPin, MessageCircle, Package, Phone, PhoneCall, Send, ShieldCheck, Sparkles, UserCheck, Users, Video, Youtube,
} from "lucide-react";
import { api } from "../api/api";
import GBLogo from "./GBLogo";

// Set VITE_SUPPORT_PHONE / VITE_SUPPORT_WHATSAPP (digits, e.g. 928000112233) in .env; contact rows stay hidden until then.
const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_PHONE as string | undefined;
const SUPPORT_WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined;

const VALUE_PROPS = [
  { icon: ShieldCheck, title: "Best Price Guarantee", text: "We ensure you get the best prices with no hidden fees." },
  { icon: Calendar, title: "Free Cancellation", text: "Free cancellation until the day before check-in." },
  { icon: Headset, title: "24/7 Support", text: "Our travel experts are always here to help." },
  { icon: Award, title: "Verified Partners", text: "Every vendor and listing is reviewed before it goes live." },
  { icon: Lock, title: "Secure Booking", text: "Your data is safe with our secure system." },
];

const SOCIALS = [
  { href: "https://facebook.com", label: "Facebook", icon: Facebook },
  { href: "https://instagram.com", label: "Instagram", icon: Instagram },
  { href: "https://youtube.com", label: "YouTube", icon: Youtube },
  ...(SUPPORT_WHATSAPP ? [{ href: `https://wa.me/${SUPPORT_WHATSAPP}`, label: "WhatsApp", icon: MessageCircle }] : []),
  { href: "https://tiktok.com", label: "TikTok", icon: Video },
];

type FooterLink = { label: string; icon: typeof MapPin; view: string; params?: Record<string, string> };
const destination = (name: string): FooterLink => ({ label: name, icon: MapPin, view: "destinations", params: { destination: name } });

const COLUMNS: Array<{ title: string; more: [string, string]; links: FooterLink[] }> = [
  {
    title: "Top Destinations", more: ["View All Destinations", "destinations"],
    links: ["Skardu", "Hunza Valley", "Gilgit", "Shigar Valley", "Deosai Plains", "Fairy Meadows", "Naltar Valley", "Attabad Lake"].map(destination),
  },
  {
    title: "Tours & Packages", more: ["View All Packages", "tours"],
    links: ([["Adventure Tours", Compass], ["Family Tours", Users], ["Honeymoon Packages", Heart], ["Jeep Safari Tours", Car], ["Trekking Tours", Compass],
      ["Camping Tours", Sparkles], ["Luxury Tours", Sparkles], ["Custom Tours", Package]] as const).map(([label, icon]) => ({ label, icon, view: "tours" })),
  },
  {
    title: "Hotels", more: ["View All Hotels", "hotels"],
    links: ([["Hotels in Skardu", Building2], ["Hotels in Hunza", Building2], ["Hotels in Gilgit", Building2], ["Luxury Hotels", Sparkles], ["Budget Hotels", Building2],
      ["Resorts", Building2], ["Guest Houses", Home], ["Homestays", Home]] as const).map(([label, icon]) => ({ label, icon, view: "hotels" })),
  },
  {
    title: "Cars & More", more: ["View All Cars", "cars"],
    links: ([["Car Rental in Skardu", "cars", Car], ["Car Rental in Hunza", "cars", Car], ["Car Rental in Gilgit", "cars", Car], ["SUVs & 4x4", "cars", Car],
      ["With Driver", "cars", UserCheck], ["Self Drive", "cars", Key], ["Travel Guide", "support", BookOpen], ["About Us", "support", Users],
      ["Contact Us", "support", PhoneCall], ["FAQs", "support", HelpCircle]] as const).map(([label, view, icon]) => ({ label, icon, view })),
  },
];

interface FooterProps {
  onNavigate?: (view: string, params?: any) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribeError("");
    try {
      await api.subscribeNewsletter(email.trim(), "footer");
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail("");
    } catch (error) {
      setSubscribeError(error instanceof Error ? error.message : "Subscription failed. Please try again.");
    }
  };

  const handleNav = (view: string, params?: any) => {
    if (onNavigate) {
      onNavigate(view, params);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full font-sans overflow-hidden">
      {/* 1. TOP VALUE PROPS BAR */}
      <div className="bg-[#F3F6F5] border-y border-slate-200/90 py-5 sm:py-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-4 items-center">
            {VALUE_PROPS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#006F3C]/10 flex items-center justify-center shrink-0 text-[#006F3C]">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">{title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MAIN DARK FOOTER */}
      <div className="bg-forest-950 text-slate-300 pt-10 sm:pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 pb-10">
            {/* Brand, social links and newsletter */}
            <div className="lg:col-span-4 space-y-4 pr-0 lg:pr-4">
              <div className="flex flex-col items-start gap-1">
                <div className="inline-flex items-center gap-2">
                  <GBLogo size="md" />
                </div>
                <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mt-1">— Explore Gilgit Baltistan —</p>
              </div>

              <p className="text-slate-300/90 text-xs leading-relaxed">
                GBBookings.com is your trusted travel partner for exploring the breathtaking beauty of Gilgit Baltistan. We offer the best
                hotels, tours, cars and experiences at unbeatable prices.
              </p>

              <div className="flex items-center flex-wrap gap-2 pt-1">
                {SOCIALS.map(({ href, label, icon: Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-colors cursor-pointer">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>

              <div className="pt-3 space-y-2">
                <h4 className="text-white font-semibold text-sm">Subscribe to Our Newsletter</h4>
                <p className="text-slate-400 text-xs leading-snug">Get the best travel deals, tips & inspiration straight to your inbox.</p>
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 pt-1 w-full">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="bg-white/5 border border-white/15 text-white text-xs px-3.5 py-2.5 rounded-xl sm:rounded-r-none sm:rounded-l-xl w-full min-h-11 focus:outline-none focus:border-emerald-400 placeholder-slate-400"
                  />
                  <button type="submit"
                    className="bg-[#006F3C] hover:bg-[#005C32] text-white text-xs font-bold px-4 py-2.5 rounded-xl sm:rounded-l-none sm:rounded-r-xl min-h-11 flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer">
                    <span>Subscribe</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
                {subscribed && <p className="text-emerald-400 text-[11px] font-semibold pt-1">✓ Thank you for subscribing!</p>}
                {subscribeError && <p role="alert" className="text-rose-300 text-[11px] font-semibold pt-1">{subscribeError}</p>}
              </div>
            </div>

            {/* Link columns */}
            {COLUMNS.map((column) => (
              <div key={column.title} className="lg:col-span-2 space-y-3">
                <h4 className="text-white font-semibold text-sm">{column.title}</h4>
                <ul className="space-y-2 text-xs">
                  {column.links.map(({ label, icon: Icon, view, params }) => (
                    <li key={label}>
                      <button onClick={() => handleNav(view, params)} className="flex items-center gap-2 hover:text-white transition-colors text-left text-slate-300">
                        <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleNav(column.more[1])} className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center gap-1 pt-1 transition-colors">
                  <span>{column.more[0]}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* 3. PAYMENT, CONTACT AND HELP */}
          <div className="border-t border-white/10 pt-8 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
              <div className="flex flex-col space-y-2 text-xs pb-6 lg:pb-0 lg:pr-6">
                <h5 className="text-white font-semibold text-xs uppercase tracking-wider">Payment</h5>
                <p className="text-slate-300">Pay on arrival: you pay the partner when you check in, pick up the car or start the tour. Online payment is coming soon.</p>
              </div>

              <div className="flex flex-col space-y-2 text-xs py-6 lg:py-0 lg:px-6">
                <h5 className="text-white font-semibold text-xs uppercase tracking-wider">Contact Us</h5>
                <div className="space-y-1.5 text-slate-300">
                  {SUPPORT_PHONE && (
                    <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-white">
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

              <div className="flex flex-col space-y-2 pt-6 lg:pt-0 lg:pl-6">
                <div>
                  <h5 className="text-white font-semibold text-xs uppercase tracking-wider">Need Help?</h5>
                  <p className="text-slate-400 text-[11px] mt-0.5">Our team can help you plan your trip or sort out a booking.</p>
                </div>
                {SUPPORT_WHATSAPP && (
                  <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noreferrer"
                    className="w-full bg-[#006F3C] hover:bg-[#005C32] text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm mt-1">
                    <MessageCircle className="w-4 h-4 text-white fill-white/20" />
                    <span>Chat on WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 4. COPYRIGHT */}
          <div className="border-t border-white/10 mt-8 pt-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400 relative z-10 text-left">
              <p className="text-left">© {new Date().getFullYear()} GBBookings.com - All Rights Reserved.</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <a href="/terms" className="hover:text-white">Terms</a>
                <a href="/privacy" className="hover:text-white">Privacy Policy</a>
                <a href="/refunds" className="hover:text-white">Refund Policy</a>
                <a href="/service" className="hover:text-white">Service Policy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
