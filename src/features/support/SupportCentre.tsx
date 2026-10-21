import React from 'react';
import { ChevronDown, LifeBuoy, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

// Same env values as the footer; rows stay hidden until they are set.
const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_PHONE as string | undefined;
const SUPPORT_WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP as string | undefined;
const SUPPORT_EMAIL = 'info@gbbookings.com';

const FAQS: Array<[string, string]> = [
  ['How do I pay?', 'Pay on arrival: you pay the property, car partner or tour partner directly at check-in, at pickup, or when the tour starts. Each listing shows the ways they accept (cash, card, JazzCash, Easypaisa or bank transfer). Online payment is coming soon.'],
  ['When is my booking confirmed?', 'After you book, the partner has 24 hours to confirm. You get an email either way. If they do not answer in time, the request is cancelled and nothing is held.'],
  ['How do I cancel?', 'Go to My Bookings and cancel any time before the check-in, pickup or tour start date. On or after that day, contact the partner directly. Their phone and WhatsApp are on your voucher once they confirm.'],
  ['Can I change my dates?', 'Contact the partner: they can move your booking to new dates or rooms if there is space. Or cancel before the start date and book again.'],
  ['How do I use a promo code?', 'Enter it on the review step of checkout. Codes are made by partners and work only on their own listings.'],
  ['How do I write a review?', 'Open My Bookings after your stay, rental or tour. You can review it once, up to 30 days after it ends.'],
  ['How do I list my hotel, homestay, cars or tours?', 'Choose "Become a partner", pick your type and upload your documents. We check them and you can start adding listings once you are approved.'],
];

export default function SupportCentre() {
  const contacts = [
    SUPPORT_WHATSAPP && { href: `https://wa.me/${SUPPORT_WHATSAPP}`, icon: MessageCircle, label: 'WhatsApp', value: 'Chat with us', external: true },
    SUPPORT_PHONE && { href: `tel:${SUPPORT_PHONE.replace(/\s/g, '')}`, icon: Phone, label: 'Phone', value: SUPPORT_PHONE },
    { href: `mailto:${SUPPORT_EMAIL}`, icon: Mail, label: 'Email', value: SUPPORT_EMAIL },
  ].filter(Boolean) as Array<{ href: string; icon: typeof Mail; label: string; value: string; external?: boolean }>;

  return (
    <div id="support-centre-view" className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
          <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight">Help & contact</h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Questions about a booking or listing? Contact us, or check the answers below. For anything about your stay, the partner's own phone and WhatsApp are on your voucher.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <aside className="lg:col-span-4 space-y-3">
          {contacts.map(({ href, icon: Icon, label, value, external }) => (
            <a key={label} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
              className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                <p className="text-sm font-semibold text-slate-800 wrap-break-word">{value}</p>
              </div>
            </a>
          ))}
          <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Office</p>
              <p className="text-sm font-semibold text-slate-800">Skardu, Gilgit Baltistan, Pakistan</p>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100" id="support-faqs">
          <h3 className="text-xs font-bold uppercase text-[#0F172A] tracking-wider px-4 sm:px-5 py-3.5">Frequently asked questions</h3>
          {FAQS.map(([question, answer]) => (
            <details key={question} className="group px-4 sm:px-5 py-3.5">
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-sm font-semibold text-slate-800">
                {question}
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">{answer}</p>
            </details>
          ))}
        </section>
      </div>
    </div>
  );
}
