import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe } from 'lucide-react';
import { Listing, Review } from './types';

type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
  requestLanguageChange: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const dictionary: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.hotels': 'Hotels',
    'nav.cars': 'Cars',
    'nav.tours': 'Tours',
    'nav.ai_planner': 'AI Planner',
    'nav.support': 'Help Desk',
    'nav.user_dashboard': 'My Bookings',
    'nav.vendor_dashboard': 'Partner Panel',
    'nav.logout': 'Sign Out',
    'nav.switch_lang': 'اردو',

    // Hero Section
    'hero.badge': 'Explore the Beauty of Gilgit Baltistan',
    'hero.title_part1': 'Find Your Perfect Stay,',
    'hero.title_part2': 'Anywhere in',
    'hero.title_highlight': 'Gilgit Baltistan',
    'hero.subtitle': 'Hotels, Homestays, Cars & Tour Packages – Everything you need for an unforgettable journey.',
    'hero.trust.best_price': 'Best Price Guarantee',
    'hero.trust.free_cancel': 'Free Cancellation',
    'hero.trust.support': '24/7 Support',
    'hero.trust.trusted': 'Trusted by Thousands',
    'hero.promo.tag': 'Limited Time Offer',
    'hero.promo.upto': 'UP TO',
    'hero.promo.discount': '40% OFF',
    'hero.promo.on_hotels': 'On Selected Hotels',
    'hero.promo.btn': 'Explore Deals',

    // Search Widget
    'search.destination': 'Destination',
    'search.dates': 'Dates',
    'search.guests': 'Guests',
    'search.hotel_tab': 'Hotels',
    'search.homestay_tab': 'Homestays',
    'search.car_tab': 'Cars',
    'search.tour_tab': 'Tours',
    'search.btn': 'Search Now',
    'search.placeholder.dest': 'e.g. Hunza Valley, Skardu...',
    'search.placeholder.dates': 'Select travel dates',
    'search.num_guests': '{count} Guests',

    // Category Cards
    'category.hotels.title': 'Hotels',
    'category.hotels.desc': 'Find the best hotel deals & luxury stays',
    'category.hotels.badge': '120+ Stays',
    'category.homestays.title': 'Homestays',
    'category.homestays.desc': 'Cozy stays with local hospitality',
    'category.homestays.badge': '800+ Properties',
    'category.cars.title': 'Cars & SUVs',
    'category.cars.desc': 'Wide range of 4x4 vehicles for your journey',
    'category.cars.badge': '500+ Vehicles',
    'category.tours.title': 'Tours & Packages',
    'category.tours.desc': 'Curated experiences just for you',
    'category.tours.badge': '50+ Packages',

    // Destinations Section
    'dest.title': 'Legendary Destinations',
    'dest.subtitle': 'Handpicked landscapes offering world-class standard facilities.',
    'dest.btn_all': 'Browse All Locations',

    // Exclusives Section
    'exclusive.title': 'The Signature Collection',
    'exclusive.subtitle': 'Award-winning, highly coveted experiences and premium fleets in Gilgit Baltistan.',
    'exclusive.btn_view': 'View Spaces',
    'exclusive.starting_from': 'Prices starting from',

    // FAQ Section
    'faq.title': 'Got Questions?',
    'faq.subtitle': 'Everything you need to know about premium bookings in Gilgit Baltistan.',

    // Listing Details & Search
    'search_results.title': 'Available {type} in Pakistan',
    'search_results.none': 'No active properties found matching your parameters.',
    'search_results.filters': 'Filters',
    'search_results.sort': 'Sort By',
    'search_results.recommended': 'Recommended',
    'search_results.price_low_high': 'Price: Low to High',
    'search_results.price_high_low': 'Price: High to Low',
    'details.back': 'Back to Listings',
    'details.reviews': '{count} verified reviews',
    'details.rooms_available': '{count} spaces left',
    'details.amenities': 'Included Amenities',
    'details.book_now': 'Proceed to Checkout',
    'details.with_driver': 'With Professional Driver (+PKR {price}/day)',
    'details.pay_at_hotel': 'Pay At Hotel (No Advance Needed)',
    'details.promo_code': 'Have a Promo Code?',
    'details.apply': 'Apply',
    'details.subtotal': 'Subtotal Rate',
    'details.driver_charges': 'Driver Surcharges',
    'details.promo_discount': 'Promo Discount',
    'details.total_pkr': 'Total Due (PKR)',
    'details.reserve_hold': 'Secure Hold Now',

    // Checkout Flow
    'checkout.title': 'Traveler Details',
    'checkout.subtitle': 'Please provide accurate contact coordinates for immigration and hospitality desks.',
    'checkout.fullname': 'Full Name',
    'checkout.email': 'Email Address',
    'checkout.phone': 'WhatsApp / Phone Number',
    'checkout.due_later': 'due later',
    'checkout.due_online': 'PKR 0 Due Online',
    'checkout.proceed_payment': 'Proceed to Payment Option',
    'checkout.secure_hold': 'Secure Reservation Hold',
    'checkout.pay_at_stay_title': 'Pay At Stay Allotment Hold',
    'checkout.pay_at_stay_desc': 'We are securing this booking slot under our PKR 0 online advance policy. Your space is held until 6:00 PM on check-in day.',
    'checkout.pay_at_stay_why': 'Why book with Pay At Stay?',
    'checkout.pay_at_stay_reason1': 'No credit card or advance cash required today',
    'checkout.pay_at_stay_reason2': 'Lock room inventory instantly on the official ledger',
    'checkout.pay_at_stay_reason3': 'Pay at reception desk using JazzCash, Card, or local currency',
    'checkout.pay_at_stay_reason4': 'Guaranteed clean, sanitized linen check upon arrival',
    'checkout.confirm_phone_label': 'Confirm WhatsApp Hold Code',
    'checkout.confirm_phone_sub': 'Host will verify hold via contact number:',
    'checkout.policy_agree': 'By continuing, you authorize direct room blocking and agree to host stay policies.',
    'checkout.authorize_btn': 'Authorize & Hold Room Allotment',
    'checkout.payment_options': 'Payment Options',
    'checkout.payment_options_sub': 'Select your preferred transaction mechanism. Local digital wallets are authorized instantly.',
    'checkout.cardholder_name': 'Cardholder Name',
    'checkout.card_number': 'Card Number',
    'checkout.expiry': 'Expiry Date',
    'checkout.cvv': 'CVV / Security Code',
    'checkout.instant_push_note': 'You will receive an instant push verification window on your mobile phone to enter your secure 4-digit Pin once the payment is triggered below.',
    'checkout.wallet_number': '{method} Mobile Account Number',
    'checkout.encryption_note': 'Encrypted via secure end-to-end payment gateway clearance. We do not store financial codes.',
    'checkout.confirm_pay_btn': 'Confirm & Authorize PKR {amount}',
    'checkout.securing_hold': 'Securing Stay Reservation Allotment',
    'checkout.securing_booking': 'Securing Reservation',
    'checkout.success_title': 'Booking Secured!',
    'checkout.success_hold_title': 'Stay Allotment Secured!',
    'checkout.success_desc': 'Transaction verified successfully. Your ticket has been logged into the ledger.',
    'checkout.success_hold_desc': 'Your physical hold token has been injected into the ledger. Present this invoice on arrival.',
    'checkout.official_invoice': 'Official Booking Invoice',
    'checkout.official_voucher': 'Official Hold Voucher Invoice',
    'checkout.printable_title': 'GBBookings Ledger Desk',
    'checkout.customer_name': 'Customer Name',
    'checkout.contact_number': 'Contact Number',
    'checkout.property_space': 'Property Space',
    'checkout.location': 'Location',
    'checkout.dates_label': 'Reservation Dates',
    'checkout.duration_label': 'Duration Details',
    'checkout.travelers_label': 'Total Travelers',
    'checkout.clearing_gateway': 'Clearing Gateway',
    'checkout.payable_at_stay': 'Payable at stay Check-In',
    'checkout.paid_total': 'Paid Total (Net PKR)',
    'checkout.barcode_hold': 'SECURE_HOLD_TICKET',
    'checkout.barcode_ledger': 'SECURE_LEDGER_TICKET',
    'checkout.print_invoice': 'Print PDF Invoice',
    'checkout.manage_trips': 'Manage My Trips',

    // User Dashboard
    'dash.gold_level': 'Gold Loyalty Level',
    'dash.verified_traveler': 'Verified Traveler',
    'dash.active_bookings': 'Active Bookings',
    'dash.wallet_balance': 'Wallet Balance',
    'dash.loyalty_coins': 'Loyalty Coins',
    'dash.tab_bookings': 'My Bookings',
    'dash.tab_wishlist': 'Saved Wishlist',
    'dash.tab_wallet': 'My Wallet',
    'dash.tab_rewards': 'Rewards & Referrals',
    'dash.tab_alerts': 'Alerts',
    'dash.no_bookings': 'You have no booking coordinates registered on this email yet.',
    'dash.browse_dest': 'Browse Pakistan Destinations',
    'dash.booking_id': 'ID:',
    'dash.paid_amount': 'Paid Amount',
    'dash.cancel_trip': 'Cancel Trip',
    'dash.invoice_btn': 'Invoice',
    'dash.wishlist_empty': 'Your wishlist is empty. Tap the heart icon on properties to save them here.',
    'dash.discover_stays': 'Discover Stays',
    'dash.starting_rate': 'Starting Rate',
    'dash.view_stay': 'View Stay',
    'dash.virtual_wallet': 'Traveler Virtual Wallet',
    'dash.topup': 'Top-Up Balance',
    'dash.cashout': 'Cash-Out',
    'dash.gold_privileges': 'Gold Tier Privileges',
    'dash.privilege1': 'Late 2:00 PM checkout priority',
    'dash.privilege2': 'Free airport shuttle transfers in Islamabad / Skardu',
    'dash.privilege3': 'Double referral bonuses',
    'dash.transaction_records': 'Transaction Records',
    'dash.invite_friends': 'Invite Friends, Travel for Free',
    'dash.invite_desc': 'Refer your peers to GBBookings. When they book their first luxury Hunza stay, we credit PKR 5,000 instantly into your virtual wallet and award them 10% off.',
    'dash.referral_code': 'Personal Referral Code',
    'dash.copy_code': 'Copy Code',
    'dash.total_referred': 'Total Referred',
    'dash.bookings_cleared': 'Bookings Cleared',
    'dash.total_earnings': 'Total Earnings',
    'dash.alerts_empty': 'No current notification alerts.',

    // Footer
    'footer.description': 'Premium Pakistan Travel Marketplace for Luxury Hotels, SUVs & Guided Mountain Tours.',
    'footer.version': 'Version 1.0.4-PROD',
    'footer.network': 'Global Booking Network: Active',
    'footer.encrypted': 'Encrypted Transaction Mode'
  },
  ur: {
    // Navbar
    'nav.home': 'ہوم',
    'nav.explore': 'سیر و تفریح',
    'nav.hotels': 'ہوٹلز',
    'nav.cars': 'گاڑیاں',
    'nav.tours': 'ٹورز',
    'nav.ai_planner': 'اے آئی پلانر',
    'nav.support': 'مدد ڈیسک',
    'nav.user_dashboard': 'میری بکنگز',
    'nav.vendor_dashboard': 'پارٹنر پینل',
    'nav.logout': 'سائن آؤٹ',
    'nav.switch_lang': 'English',

    // Hero Section
    'hero.badge': 'گلگت بلتستان کی خوبصورتی دریافت کریں',
    'hero.title_part1': 'اپنی بہترین رہائش پائیں،',
    'hero.title_part2': 'صرف اور صرف',
    'hero.title_highlight': 'گلگت بلتستان میں',
    'hero.subtitle': 'ہوٹل، ہوم سٹیز، گاڑیاں اور گائیڈڈ ٹور پیکیجز - آپ کے یادگار سفر کی ہر ضرورت یہاں موجود ہے۔',
    'hero.trust.best_price': 'بہترین قیمت کی ضمانت',
    'hero.trust.free_cancel': 'مفت منسوخی',
    'hero.trust.support': '24/7 مدد',
    'hero.trust.trusted': 'ہزاروں کا بھروسہ',
    'hero.promo.tag': 'محدود وقت کی آفر',
    'hero.promo.upto': 'تک',
    'hero.promo.discount': '40% بچت',
    'hero.promo.on_hotels': 'منتخب ہوٹلوں پر',
    'hero.promo.btn': 'آفرز دیکھیں',

    // Search Widget
    'search.destination': 'منزل',
    'search.dates': 'تاریخیں',
    'search.guests': 'مہمان',
    'search.hotel_tab': 'ہوٹل',
    'search.homestay_tab': 'ہوم سٹیز',
    'search.car_tab': 'گاڑیاں',
    'search.tour_tab': 'ٹورز',
    'search.btn': 'تلاش کریں',
    'search.placeholder.dest': 'مثلاً وادی ہنزہ، سکردو...',
    'search.placeholder.dates': 'سفر کی تاریخیں منتخب کریں',
    'search.num_guests': '{count} مہمان',

    // Category Cards
    'category.hotels.title': 'ہوٹلز',
    'category.hotels.desc': 'بہترین ہوٹل ڈیلز اور پرتعیش رہائش تلاش کریں',
    'category.hotels.badge': '120+ ہوٹلز',
    'category.homestays.title': 'ہوم سٹیز',
    'category.homestays.desc': 'مقامی مہمان نوازی کے ساتھ آرام دہ رہائش',
    'category.homestays.badge': '800+ جائیدادیں',
    'category.cars.title': 'گاڑیاں اور جیپیں',
    'category.cars.desc': 'آپ کے پہاڑی سفر کے لیے فور بائی فور گاڑیاں',
    'category.cars.badge': '500+ گاڑیاں',
    'category.tours.title': 'ٹور پیکیجز',
    'category.tours.desc': 'صرف آپ کے لیے تیار کردہ تفریحی پیکیجز',
    'category.tours.badge': '50+ پیکیجز',

    // Destinations Section
    'dest.title': 'مشہور تفریحی مقامات',
    'dest.subtitle': 'عالمی معیار کی سہولیات سے آراستہ منتخب اور خوبصورت ترین مقامات۔',
    'dest.btn_all': 'تمام مقامات دیکھیں',

    // Exclusives Section
    'exclusive.title': 'ہمارا خاص مجموعہ',
    'exclusive.subtitle': 'گلگت بلتستان میں سب سے زیادہ پسند کی جانے والی رہائش اور پریمیم گاڑیاں۔',
    'exclusive.btn_view': 'تفصیلات دیکھیں',
    'exclusive.starting_from': 'ابتدائی قیمت',

    // FAQ Section
    'faq.title': 'کوئی سوال ہے؟',
    'faq.subtitle': 'گلگت بلتستان میں پریمیم بکنگز کے بارے میں ہر وہ چیز جو آپ جاننا چاہتے ہیں۔',

    // Listing Details & Search
    'search_results.title': 'پاکستان میں دستیاب {type}',
    'search_results.none': 'آپ کے معیار کے مطابق کوئی رہائش نہیں ملی۔',
    'search_results.filters': 'فلٹرز',
    'search_results.sort': 'ترتیب دیں',
    'search_results.recommended': 'تجویز کردہ',
    'search_results.price_low_high': 'قیمت: کم سے زیادہ',
    'search_results.price_high_low': 'قیمت: زیادہ سے کم',
    'details.back': 'واپس تلاش پر جائیں',
    'details.reviews': '{count} تصدیق شدہ جائزے',
    'details.rooms_available': '{count} کمرے باقی ہیں',
    'details.amenities': 'شامل سہولیات',
    'details.book_now': 'بکنگ کی طرف بڑھیں',
    'details.with_driver': 'ماہر مقامی ڈرائیور کے ساتھ (+روپے {price}/روزانہ)',
    'details.pay_at_hotel': 'ہوٹل پر ادائیگی (کوئی پیشگی رقم درکار نہیں)',
    'details.promo_code': 'کیا آپ کے پاس پرومو کوڈ ہے؟',
    'details.apply': 'لگوائیں',
    'details.subtotal': 'رقم',
    'details.driver_charges': 'ڈرائیور چارجز',
    'details.promo_discount': 'رعایت',
    'details.total_pkr': 'کل واجب الادا رقم (روپے)',
    'details.reserve_hold': 'سیٹ محفوظ کریں',

    // Checkout Flow
    'checkout.title': 'مسافر کی معلومات',
    'checkout.subtitle': 'براہ کرم امیگریشن اور ہوٹل ڈیسک کے لیے درست رابطے کی معلومات فراہم کریں۔',
    'checkout.fullname': 'پورا نام',
    'checkout.email': 'ای میل ایڈریس',
    'checkout.phone': 'واٹس ایپ / فون نمبر',
    'checkout.due_later': 'بعد میں ادائیگی',
    'checkout.due_online': 'روپے 0 آن لائن واجب الادا',
    'checkout.proceed_payment': 'ادائیگی کے طریقے کی طرف بڑھیں',
    'checkout.secure_hold': 'محفوظ ریزرویشن ہولڈ',
    'checkout.pay_at_stay_title': 'ہوٹل پر ادائیگی کا ہولڈ',
    'checkout.pay_at_stay_desc': 'ہم آپ کی سیٹ روپے 0 آن لائن پیشگی رقم کی پالیسی کے تحت محفوظ کر رہے ہیں۔ آپ کی رہائش آمد کے دن شام 6:00 بجے تک ہولڈ رہے گی۔',
    'checkout.pay_at_stay_why': 'ہوٹل پر ادائیگی کے ساتھ بکنگ کیوں کریں؟',
    'checkout.pay_at_stay_reason1': 'آج کسی کریڈٹ کارڈ یا پیشگی نقد رقم کی ضرورت نہیں ہے',
    'checkout.pay_at_stay_reason2': 'سرکاری کھاتے پر فوری کمرہ محفوظ کریں',
    'checkout.pay_at_stay_reason3': 'ہوٹل پہنچ کر ایزی پیسہ، جیز کیش یا کارڈ سے ادئیگی کریں',
    'checkout.pay_at_stay_reason4': 'آمد پر بالکل صاف اور سینیٹائزڈ کمرے کی ضمانت',
    'checkout.confirm_phone_label': 'واٹس ایپ ہولڈ کوڈ کی تصدیق کریں',
    'checkout.confirm_phone_sub': 'ہوسٹ اس نمبر کے ذریعے بکنگ کی تصدیق کرے گا:',
    'checkout.policy_agree': 'جاری رکھ کر، آپ کمرہ بلاک کرنے کی اجازت دیتے ہیں اور ہوٹل کے قوانین سے اتفاق کرتے ہیں۔',
    'checkout.authorize_btn': 'ریزرویشن منظور اور کمرہ بلاک کریں',
    'checkout.payment_options': 'ادائیگی کے اختیارات',
    'checkout.payment_options_sub': 'اپنا پسندیدہ ادائیگی کا طریقہ منتخب کریں۔ مقامی ڈیجیٹل والٹس فوری طور پر منظور کیے جاتے ہیں۔',
    'checkout.cardholder_name': 'کارڈ ہولڈر کا نام',
    'checkout.card_number': 'کارڈ نمبر',
    'checkout.expiry': 'میعاد ختم ہونے کی تاریخ',
    'checkout.cvv': 'سیکیورٹی کوڈ (CVV)',
    'checkout.instant_push_note': 'نیچے ادائیگی کی منظوری کے بعد آپ کو اپنے موبائل فون پر فوری پن کوڈ داخل کرنے کی ونڈو موصول ہوگی۔',
    'checkout.wallet_number': '{method} موبائل اکاؤنٹ نمبر',
    'checkout.encryption_note': 'محفوظ اینڈ ٹو اینڈ ادائیگی کے گیٹ وے سے خفیہ کردہ۔ ہم آپ کے کارڈ کی تفصیلات محفوظ نہیں کرتے۔',
    'checkout.confirm_pay_btn': 'روپے {amount} کی ادائیگی منظور کریں',
    'checkout.securing_hold': 'رہائش کا ہولڈ محفوظ کیا جا رہا ہے',
    'checkout.securing_booking': 'ریزرویشن محفوظ کی جا رہی ہے',
    'checkout.success_title': 'بکنگ محفوظ ہو گئی!',
    'checkout.success_hold_title': 'رہائش محفوظ ہو گئی!',
    'checkout.success_desc': 'ادائیگی کامیابی سے مکمل ہو گئی ہے۔ آپ کا ٹکٹ سرکاری کھاتے میں درج کر لیا گیا ہے۔',
    'checkout.success_hold_desc': 'آپ کی ریزرویشن کا ٹوکن کھاتے میں شامل کر دیا گیا ہے۔ ہوٹل پہنچنے پر یہ رسید دکھائیں۔',
    'checkout.official_invoice': 'سرکاری بکنگ انوائس',
    'checkout.official_voucher': 'سرکاری ہولڈ واؤچر رسید',
    'checkout.printable_title': 'جی بی بکنگز لیجر ڈیسک',
    'checkout.customer_name': 'صارف کا نام',
    'checkout.contact_number': 'رابطہ نمبر',
    'checkout.property_space': 'رہائش / گاڑی کی تفصیل',
    'checkout.location': 'مقام',
    'checkout.dates_label': 'بکنگ کی تاریخیں',
    'checkout.duration_label': 'دورانیہ',
    'checkout.travelers_label': 'کل مسافر',
    'checkout.clearing_gateway': 'ادائیگی کا ذریعہ',
    'checkout.payable_at_stay': 'ہوٹل پہنچنے پر قابل ادائیگی رقم',
    'checkout.paid_total': 'ادا کردہ کل رقم (روپے)',
    'checkout.barcode_hold': 'محفوظ_ہولڈ_ٹکٹ',
    'checkout.barcode_ledger': 'محفوظ_لیجر_ٹکٹ',
    'checkout.print_invoice': 'انوائس پرنٹ کریں',
    'checkout.manage_trips': 'میری بکنگز کا انتظام کریں',

    // User Dashboard
    'dash.gold_level': 'گولڈ لائلٹی لیول',
    'dash.verified_traveler': 'تصدیق شدہ مسافر',
    'dash.active_bookings': 'فعال بکنگز',
    'dash.wallet_balance': 'والٹ بیلنس',
    'dash.loyalty_coins': 'لائلٹی کوائنز',
    'dash.tab_bookings': 'میری بکنگز',
    'dash.tab_wishlist': 'پسندیدہ فہرست',
    'dash.tab_wallet': 'میرا والٹ',
    'dash.tab_rewards': 'انعامات اور ریفرل',
    'dash.tab_alerts': 'الرٹس',
    'dash.no_bookings': 'اس ای میل پر فی الحال کوئی بکنگ رجسٹرڈ نہیں ہے۔',
    'dash.browse_dest': 'پاکستان کے خوبصورت مقامات دیکھیں',
    'dash.booking_id': 'آئی ڈی:',
    'dash.paid_amount': 'ادا کردہ رقم',
    'dash.cancel_trip': 'منسوخ کریں',
    'dash.invoice_btn': 'انوائس',
    'dash.wishlist_empty': 'آپ کی پسندیدہ فہرست خالی ہے۔ ہوٹلوں پر دل کا آئیکن دبا کر یہاں محفوظ کریں۔',
    'dash.discover_stays': 'رہائش دریافت کریں',
    'dash.starting_rate': 'ابتدائی قیمت',
    'dash.view_stay': 'تفصیل دیکھیں',
    'dash.virtual_wallet': 'مسافر کا ورچوئل والٹ',
    'dash.topup': 'بیلنس لوڈ کریں',
    'dash.cashout': 'رقم نکالیں',
    'dash.gold_privileges': 'گولڈ لیول کے فوائد',
    'dash.privilege1': 'آمد پر دیر سے (دوپہر 2 بجے) چیک آؤٹ کی سہولت',
    'dash.privilege2': 'اسلام آباد / سکردو میں ایئرپورٹ شٹل سروس بالکل مفت',
    'dash.privilege3': 'دوگنا ریفرل والٹ بونس',
    'dash.transaction_records': 'لین دین کا ریکارڈ',
    'dash.invite_friends': 'دوستوں کو بلائیں، مفت سفر کریں',
    'dash.invite_desc': 'اپنے دوستوں کو جی بی بکنگز پر مدعو کریں۔ جب وہ پہلی بار ہنزہ یا سکردو میں ہوٹل بک کریں گے تو آپ کو روپے 5,000 فوری والٹ بونس ملے گا اور ان کو 10 فیصد رعایت ملے گی۔',
    'dash.referral_code': 'ذاتی ریفرل کوڈ',
    'dash.copy_code': 'کوڈ کاپی کریں',
    'dash.total_referred': 'کل مدعو دوست',
    'dash.bookings_cleared': 'منظور شدہ بکنگز',
    'dash.total_earnings': 'کل آمدنی',
    'dash.alerts_empty': 'فی الحال کوئی نیا الرٹ موجود نہیں ہے۔',

    // Footer
    'footer.description': 'پرتعیش ہوٹلوں، جیپوں اور پہاڑی ٹورز کے لیے پاکستان کی سب سے قابل بھروسہ پریمیم مارکیٹ پلیس۔',
    'footer.version': 'ورژن 1.0.4-پروڈکشن',
    'footer.network': 'عالمی بکنگ نیٹ ورک: فعال',
    'footer.encrypted': 'محفوظ ترین ٹرانزیکشن موڈ'
  }
};

const listingTranslations: Record<string, {
  title: string;
  location: string;
  description: string;
  hotelType?: string;
  amenities?: Record<string, string>;
  category?: string;
  transmission?: string;
  fuelType?: string;
  difficulty?: string;
  included?: Record<string, string>;
  itinerary?: Record<number, { title: string; desc: string }>;
}> = {
  'h-1': {
    title: 'لکژس ہنزہ ریزورٹ اینڈ سپا',
    location: 'عطا آباد جھیل، وادی ہنزہ',
    description: 'عطا آباد جھیل کے دلفریب نیلگوں پانیوں کے بالکل کنارے پر واقع، لکژس ہنزہ ایک شاندار پرتعیش تجربہ پیش کرتا ہے۔ اپنی نجی گرم بالکونی سے قراقرم کی چوٹیوں پر غروب آفتاب کا نظارہ کریں، ہمارے عالمی معیار کے انفینٹی پول میں آرام کریں، اور ہنزہ کے مقامی اجزاء سے تیار کردہ لذیذ ترین کھانوں سے لطف اندوز ہوں۔',
    hotelType: 'پرتعیش ریزورٹ',
    amenities: {
      'Heated Balcony': 'گرم بالکونی',
      'Infinity Pool': 'انفینٹی پول',
      'Spa & Wellness Center': 'سپا اور فٹنس سینٹر',
      'Lakeside Fine Dining': 'جھیل کنارے شاندار ڈائننگ',
      'High-speed Wi-Fi': 'تیز ترین وائی فائی',
      'Helipad Access': 'ہیلی پیڈ تک رسائی'
    }
  },
  'h-2': {
    title: 'شنگریلا ریزورٹ سکردو',
    location: 'لوئر کچورا جھیل، سکردو',
    description: 'اکثر زمین پر جنت کے نام سے پکارا جانے والا، شنگریلا ریزورٹ سکردو دنیا کی بلند ترین چوٹیوں کے درمیان، دل کی شکل کی خوبصورت کچورا جھیل کے گرد واقع ہے۔ یہ آرام دہ کاٹیجز، سرسبز پھلوں کے باغات اور گرینائٹ کی چٹانوں کے سائے تلے کشتی رانی کی سہولت فراہم کرتا ہے۔',
    hotelType: 'فطرت ریزورٹ',
    amenities: {
      'Lakeside Cottages': 'جھیل کنارے کاٹیجز',
      'Private Boating': 'نجی کشتی رانی',
      'Orchard Walks': 'باغات کی سیر',
      'Free Airport Shuttle': 'مفت ایئرپورٹ شٹل',
      'Mini-Golf Course': 'منی گولف کورس',
      'Traditional Restaurant': 'روایتی ریسٹورنٹ'
    }
  },
  'h-3': {
    title: 'سرینا ہوٹل اسلام آباد',
    location: 'جی فائیو سیکٹر، اسلام آباد',
    description: 'جدید ترین لگژری کے ساتھ روایتی اسلامی فن تعمیر کا ایک شاہکار، سرینا ہوٹل اسلام آباد مارگلہ پہاڑیوں کے نظارے کے ساتھ چھ ایکڑ کے سرسبز باغات میں کھڑا ہے۔ یہ اپنے اعلیٰ ترین سیکیورٹی معیار، اشرافیہ کے کانفرنس ہالز، اور لذیذ کھانوں کے لیے مشہور ہے۔',
    hotelType: '5 اسٹار بزنس اور ہیریٹیج ہوٹل',
    amenities: {
      'Executive Lounges': 'ایگزیکٹو لاؤنجز',
      'Maisha Spa & Gym': 'ملیشا سپا اور جم',
      'Diplomatic Enclave Shuttle': 'ڈپلومیٹک انکلیو شٹل',
      'Margalla View Rooftop': 'مارگلہ ویو روف ٹاپ',
      'Outdoor Pool': 'آؤٹ ڈور پول',
      '24/7 Butler Service': '24/7 بٹلر سروس'
    }
  },
  'h-4': {
    title: 'ملم جبہ اسکی ریزورٹ ہوٹل',
    location: 'اسکی سلوپس، ملم جبہ، سوات',
    description: 'پاکستان کے اولین اسکی تفریحی مقام کا پرتعیش انداز میں تجربہ کریں۔ ملم جبہ چیئرلفٹ تک براہ راست رسائی، مرکزی ہیٹنگ والے آرام دہ لکڑی کے کمرے، اور برف باری کے بعد گرمائش کے لیے فائر سائیڈ لاؤنج کی شاندار سہولت۔',
    hotelType: 'الپائن اسکی ریزورٹ',
    amenities: {
      'Ski-in / Ski-out Access': 'چیئر لفٹ تک براہ راست رسائی',
      'Chairlift Passes': 'چیئرلفٹ پاسز',
      'Heated Rooms': 'گرم کمرے',
      'Fireside Lounge': 'فائر سائیڈ لاؤنج',
      'Ski Rental Shop': 'اسکی رینٹل شاپ',
      'Indoor Activity Zone': 'انڈور سرگرمیوں کا زون'
    }
  },
  'c-1': {
    title: 'ٹویوٹا پراڈو TXL (4x4 SUV)',
    location: 'گلگت اور سکردو ریجن',
    description: 'شمالی پاکستان کے دشوار گزار راستوں پر سفر کرنے کے لیے بہترین انتخاب۔ یہ ٹویوٹا پراڈو بہترین گراؤنڈ کلیئرنس، فور ویل ڈرائیو اور پہاڑی راستوں کے ماہر مقامی ڈرائیورز کی سہولت کے ساتھ دستیاب ہے۔',
    category: '4x4 پریمیم ایس یو وی',
    transmission: 'آٹومیٹک',
    fuelType: 'ڈیزل'
  },
  'c-2': {
    title: 'کیا سپورٹیج AWD',
    location: 'اسلام آباد اور پشاور',
    description: 'ایک خوبصورت، ہموار اور آرام دہ ایس یو وی جو سوات، کلام اور ناران کی موٹر وے کے لیے بہترین ہے۔ اس میں پینورامک سن روف، جدید سسٹم اور بہترین ایندھن کی بچت شامل ہے۔',
    category: 'کمپیکٹ ایس یو وی',
    transmission: 'آٹومیٹک',
    fuelType: 'پیٹرول'
  },
  'c-3': {
    title: 'ٹویوٹا گرینڈ کیبن (HiAce)',
    location: 'لاہور اور اسلام آباد',
    description: 'بڑے خاندانوں یا کارپوریٹ ٹور گروپس کے لیے بہترین انتخاب۔ آرام دہ اور کشادہ نشستیں، طاقتور ڈبل اے سی، اور طویل راستوں کے ماہر پیشہ ور ڈرائیور کی خدمات۔',
    category: 'پرتعیش کوچ',
    transmission: 'مینول',
    fuelType: 'ڈیزل'
  },
  't-1': {
    title: 'وادی ہنزہ میں خزاں کا جادو',
    location: 'گلگت، ہنزہ، عطا آباد، پاسو',
    description: 'شمالی پاکستان کی وادیوں میں خزاں کے موسم میں پاپولر، خوبانی اور چیری کے درختوں کے سنہری اور نارنجی رنگوں کا دلفریب نظارہ کریں۔ یہ پریمیم ٹور آپ کو تاریخی قلعوں، شفاف جھیلوں اور شاندار پہاڑی نظاروں کی سیر کرواتا ہے۔',
    difficulty: 'آسان',
    included: {
      '4-Star Lakeside Hotel Stay': '4 اسٹار جھیل کنارے ہوٹل کی رہائش',
      'Daily Buffet Breakfast & Dinner': 'روزانہ بوفے ناشتہ اور رات کا کھانا',
      'Private Prado SUV with Driver': 'ڈرائیور کے ساتھ ذاتی پراڈو جیپ',
      'Historical Fort Entry Tickets': 'تاریخی قلعوں کے انٹری ٹکٹ',
      'Lakeside Boating Trip': 'جھیل میں کشتی رانی کا سفر',
      'Professional Tour Guide': 'پیشہ ور مقامی ٹور گائیڈ'
    },
    itinerary: {
      1: { title: 'گلگت آمد اور ہنزہ کا سفر', desc: 'گلگت ایئرپورٹ پر آمد، اپنے گائیڈ سے ملاقات اور شاہراہ قراقرم پر ہنزہ کا سفر۔' },
      2: { title: 'کریم آباد اور بلتت قلعہ کی سیر', desc: '700 سال پرانے تاریخی بلتت قلعہ کی سیر، کریم آباد بازار کا دورہ اور ایگلز نیسٹ سے غروب آفتاب کا نظارہ۔' },
      3: { title: 'عطا آباد جھیل اور پاسو سسپنشن برج', desc: 'خوبصورت نیلگوں عطا آباد جھیل میں کشتی رانی، شاندار پاسو کونز کا نظارہ اور سنسنی خیز پاسو معلق پل پر واک۔' },
      4: { title: 'خنجراب پاس (پاک چین سرحد)', desc: '4,693 میٹر کی بلندی پر دنیا کی بلند ترین پکی سرحد کا دورہ۔ خوبصورت ہمالیائی آئی بیکس اور برف باری کا لطف۔' },
      5: { title: 'التت قلعہ اور شاہی باغات کا ٹور', desc: 'التت گاؤں اور اس کے 1100 سال پرانے قلعے کی سیر۔ آرگینک کیفے میں مقامی اخروٹ کے کیک کا لطف۔' },
      6: { title: 'ہوپر گلیشیر اور وادی نگر کی سیر', desc: 'ہمسایہ وادی نگر کا سفر، خوبصورت ہوپر گلیشیر کا نظارہ اور مقامی نگر مہمان نوازی کا تجربہ۔' },
      7: { title: 'گلگت سے واپسی', desc: 'یادگار یادوں کے ساتھ اسلام آباد واپسی کے لیے گلگت ایئرپورٹ کا سفر۔' }
    }
  },
  't-2': {
    title: 'دیوسائی پلیٹو اور سکردو مہم',
    location: 'سکردو، دیوسائی، کولڈ ڈیزرٹ، شگر',
    description: 'عظیم قراقرم کے پہاڑوں کے گیٹ وے سکردو کی سیر کریں۔ اس پریمیم ٹور میں دیوسائی نیشنل پارک (دنیا کا دوسرا بلند ترین سطح مرتفع)، کٹپانہ کے ٹھنڈے صحرا میں ستاروں کا نظارہ، اور تاریخی شگر قلعہ میں رہائش شامل ہے۔',
    difficulty: 'درمیانہ',
    included: {
      'Luxury Heritage Resort Stays': 'پرتعیش ہیریٹیج ریزورٹ کی رہائش',
      'Full Board Meal Plan (Breakfast, Lunch, Dinner)': 'روزانہ صبح، دوپہر اور رات کا کھانا',
      'Dedicated 4x4 Prado Cruisers': 'مخصوص 4x4 پراڈو کروزرز',
      'Deosai National Park Permits': 'دیوسائی نیشنل پارک کے اجازت نامے',
      'Katpana Desert Glamping Evening': 'کٹپانہ صحرا میں گلیپنگ کی شام',
      'Local Balti Culturist Guide': 'مقامی بلتی ثقافتی گائیڈ'
    },
    itinerary: {
      1: { title: 'سکردو آمد اور کچورا جھیلیں', desc: 'سکردو آمد، کچورا اور شنگریلا جھیلوں کی سیر۔ مقامی ٹراؤٹ مچھلی کا ظہرانہ۔' },
      2: { title: 'دیوسائی نیشنل پارک جنگلی حیات سفاری', desc: '4,114 میٹر پر واقع دیوسائی کے لامتناہی میدانوں کی سیر۔ شیوسر جھیل کا دورہ اور بھورے ریچھ کی تلاش۔' },
      3: { title: 'تاریخی وادی شگر اور شاہی قلعہ', desc: 'وادی شگر کا سفر، 17ویں صدی کے بحال شدہ شگر قلعے کی سیر اور مقامی خوبانی کے باغات کی واک۔' },
      4: { title: 'کٹپانہ ریت کے ٹیلے اور ستاروں کا نظارہ', desc: 'برف پوش پہاڑوں کے درمیان واقع سفید ریت کے ٹیلوں کا نظارہ۔ کہکشاں کے سائے تلے کیمپنگ اور باربی کیو۔' },
      5: { title: 'منٹھوکا آبشار اور دریائے سندھ کا سنگم', desc: 'شاندار 180 فٹ بلند منٹھوکا آبشار کی سیر، اور دریائے سندھ اور شگر کے سنگم کا دورہ۔' },
      6: { title: 'وفاقی دارالحکومت واپسی', desc: 'ننگا پربت کے حسین نظارے کے ساتھ واپسی کی پرواز کے لیے سکردو ایئرپورٹ کا سفر۔' }
    }
  }
};

const reviewTranslations: Record<string, { author: string; comment: string }> = {
  'r-1': { author: 'ڈاکٹر سارہ خان', comment: 'بلاشبہ پاکستان کا سب سے خوبصورت نظارہ۔ کمرہ براہ راست خوبصورت جھیل کی طرف کھلتا ہے۔ بہترین لگژری اور شاندار مہمان نوازی!' },
  'r-2': { author: 'کامران علوی', comment: 'کھانا بہت لذیذ ہے، درجہ حرارت گرنے کے باوجود گرم بالکونی نے ہمیں آرام دہ رکھا۔ قیمت کا پورا نعم البدل۔' },
  'r-3': { author: 'زینب جمیل', comment: 'پراڈو بالکل نئی حالت میں تھی، اور ہمارے ڈرائیور طارق صاحب پاسو کے دشوار گزار راستوں پر گاڑی چلانے کے ماہر تھے۔' },
  'r-4': { author: 'رچرڈ بینسن', comment: 'خزاں کے رنگ دنیا سے باہر ہیں! ہر چھوٹے سے چھوٹے پہلو کا انتظام جی بی بکنگز نے بہترین طریقے سے کیا۔ مقامی میزبان کی خدمات حاصل کرنے کا مشورہ دیتا ہوں۔' }
};

export function tListing(listing: Listing, isRtl: boolean): Listing {
  if (!isRtl) return listing;
  const trans = listingTranslations[listing.id];
  if (!trans) return listing;

  const translated: Listing = {
    ...listing,
    title: trans.title,
    location: trans.location,
    description: trans.description,
  };

  if (listing.hotelSpecs && trans.hotelType) {
    translated.hotelSpecs = {
      ...listing.hotelSpecs,
      hotelType: trans.hotelType,
      amenities: listing.hotelSpecs.amenities.map(a => trans.amenities?.[a] || a)
    };
  }

  if (listing.carSpecs) {
    translated.carSpecs = {
      ...listing.carSpecs,
      category: trans.category || listing.carSpecs.category,
      fuelType: trans.fuelType || listing.carSpecs.fuelType,
      transmission: (trans.transmission as any) || listing.carSpecs.transmission
    };
  }

  if (listing.tourSpecs) {
    translated.tourSpecs = {
      ...listing.tourSpecs,
      difficulty: (trans.difficulty as any) || listing.tourSpecs.difficulty,
      included: listing.tourSpecs.included.map(inc => trans.included?.[inc] || inc),
      itinerary: listing.tourSpecs.itinerary.map(item => {
        const itemTrans = trans.itinerary?.[item.day];
        return itemTrans ? { ...item, title: itemTrans.title, desc: itemTrans.desc } : item;
      })
    };
  }

  return translated;
}

export function tReview(review: Review, isRtl: boolean): Review {
  if (!isRtl) return review;
  const trans = reviewTranslations[review.id];
  if (!trans) return review;
  return {
    ...review,
    author: trans.author,
    comment: trans.comment
  };
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved === 'ur' || saved === 'en') ? saved : 'en';
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<'en' | 'ur' | null>(null);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
  };

  const requestLanguageChange = (lang: Language) => {
    if (lang === 'ur' && language !== 'ur') {
      setPendingLanguage('ur');
      setShowPermissionModal(true);
    } else {
      setLanguage(lang);
    }
  };

  const t = (key: string): string => {
    const val = dictionary[language]?.[key] || dictionary['en']?.[key] || key;
    return val;
  };

  const isRtl = language === 'ur';

  useEffect(() => {
    // Dynamically adjust html dir and lang attributes
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    // Apply styling helper classes if needed
    if (isRtl) {
      document.body.classList.add('font-urdu');
    } else {
      document.body.classList.remove('font-urdu');
    }
  }, [language, isRtl]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl, requestLanguageChange }}>
      <div className={isRtl ? 'rtl-layout' : 'ltr-layout'}>
        {children}
      </div>

      {/* Centered Urdu Language Permission Dialog */}
      <AnimatePresence>
        {showPermissionModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" id="language-permission-modal">
            {/* Backdrop */}
            <div
              onClick={() => setShowPermissionModal(false)}
              className="absolute inset-0 cursor-default"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 text-left overflow-hidden z-10 my-4"
              dir="ltr"
            >
              {/* Pattern Header Accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
              
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-950 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span>Language Permission</span>
                    <span className="text-slate-300 hidden sm:inline">|</span>
                    <span className="font-urdu font-medium text-emerald-700">اردو زبان</span>
                  </h3>
                  <p className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-600">Urdu Language Request</p>
                </div>
              </div>

              <div className="space-y-3 py-0.5 text-slate-600 text-xs sm:text-sm leading-relaxed">
                <p className="font-medium text-slate-900 border-b border-slate-100 pb-2.5">
                  Would you like to experience GBBookings.com in beautifully rendered, hand-crafted Urdu typography?
                </p>
                <p className="font-urdu font-medium text-slate-700 text-xs sm:text-base leading-relaxed bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 text-right" dir="rtl">
                  کیا آپ ویب سائٹ کو شاندار اور پڑھنے میں انتہائی آسان اردو رسم الخط میں دیکھنا چاہتے ہیں؟
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                <button
                  id="btn-confirm-language-cancel"
                  onClick={() => {
                    setShowPermissionModal(false);
                    setPendingLanguage(null);
                  }}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer text-center min-h-[42px] flex items-center justify-center"
                >
                  Cancel / منسوخ
                </button>
                <button
                  id="btn-confirm-language-approve"
                  onClick={() => {
                    if (pendingLanguage) {
                      setLanguage(pendingLanguage);
                    }
                    setShowPermissionModal(false);
                    setPendingLanguage(null);
                  }}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/10 hover:shadow-emerald-700/20 cursor-pointer text-center min-h-[42px]"
                >
                  Yes, Switch / تبدیل کریں
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
