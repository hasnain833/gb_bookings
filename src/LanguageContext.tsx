import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ur';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
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

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved === 'ur' || saved === 'en') ? saved : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_lang', lang);
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
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      <div className={isRtl ? 'rtl-layout' : 'ltr-layout'}>
        {children}
      </div>
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
