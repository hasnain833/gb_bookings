/**
 * Urdu for the customer-facing site. Text is matched as written in English and swapped on the page, so components stay
 * in English and a new string simply shows in English until it is added here.
 * ponytail: exact-match dictionary, covers guest pages only; move to t() keys if partner and admin screens need Urdu too.
 */
const WORDS: Record<string, string> = {
  // Navigation and account
  'Help & support': 'مدد اور معاونت', 'Language': 'زبان', 'Explore': 'دریافت کریں', 'My bookings': 'میری بکنگز', 'Profile': 'پروفائل', 'Saved stays': 'محفوظ قیام گاہیں',
  'Messages': 'پیغامات', 'Partner dashboard': 'پارٹنر ڈیش بورڈ', 'Become a partner': 'پارٹنر بنیں', 'Sign in': 'لاگ ان کریں', 'Register': 'رجسٹر کریں', 'My account': 'میرا اکاؤنٹ', 'Sign out': 'لاگ آؤٹ',
  'Hotels': 'ہوٹل', 'Homestays': 'ہوم اسٹے', 'Cars': 'گاڑیاں', 'Tours': 'ٹورز', 'Destinations': 'مقامات', 'Offers': 'پیشکشیں', 'Home': 'ہوم', 'Trips': 'سفر', 'Inbox': 'ان باکس',
  'Plan my trip': 'میرا سفر پلان کریں', 'Verified local partners · Free cancellation before check-in': 'تصدیق شدہ مقامی پارٹنرز · چیک اِن سے پہلے مفت منسوخی',
  // Home and search
  'Find your next stay in Gilgit-Baltistan': 'گلگت بلتستان میں اپنی اگلی قیام گاہ تلاش کریں', 'Hotels, homestays, tours and cars from local partners. Pay now or on arrival.': 'مقامی پارٹنرز کے ہوٹل، ہوم اسٹے، ٹورز اور گاڑیاں۔ ابھی ادائیگی کریں یا پہنچنے پر۔',
  'Where are you going?': 'آپ کہاں جا رہے ہیں؟', 'Search': 'تلاش کریں', 'Popular destinations': 'مقبول مقامات', 'Guests': 'مہمان', 'Done': 'ہو گیا', 'Featured': 'نمایاں', 'New': 'نیا', 'All': 'سب', 'Add date': 'تاریخ شامل کریں', 'Browse all': 'سب دیکھیں',
  'Featured Hotels': 'نمایاں ہوٹل', 'Filters': 'فلٹرز', 'Hide filters': 'فلٹرز چھپائیں', 'Reset': 'دوبارہ ترتیب دیں', 'Available between': 'ان تاریخوں میں دستیاب', 'Any': 'کوئی بھی', 'When': 'کب', 'Start date': 'شروع کی تاریخ',
  'Travellers': 'مسافر', 'Any type': 'کوئی بھی قسم', 'Minimum rating': 'کم از کم ریٹنگ', 'Any rating': 'کوئی بھی ریٹنگ', '3+ stars': '3+ ستارے', '4+ stars': '4+ ستارے', '4.5+ stars': '4.5+ ستارے',
  'Breakfast included': 'ناشتہ شامل ہے', 'Facilities and amenities': 'سہولیات', 'Separate required facilities with commas.': 'مطلوبہ سہولیات کو کوما سے الگ کریں۔', 'Experience': 'تجربہ', 'Any experience': 'کوئی بھی تجربہ',
  'Type of stay': 'قیام کی قسم', 'Rooms or entire home': 'کمرے یا پورا گھر', 'Private rooms': 'نجی کمرے', 'Entire home': 'پورا گھر', 'Driver': 'ڈرائیور', 'With or without': 'ساتھ یا بغیر', 'With driver': 'ڈرائیور کے ساتھ', 'Self-drive': 'خود ڈرائیو',
  'Transmission': 'گیئر باکس', 'Automatic': 'آٹومیٹک', 'Manual': 'مینوئل', 'Recommended': 'تجویز کردہ', 'Price: low to high': 'قیمت: کم سے زیادہ', 'Price: high to low': 'قیمت: زیادہ سے کم', 'Highest rated': 'سب سے زیادہ ریٹنگ',
  'Try again': 'دوبارہ کوشش کریں', 'Clear search': 'تلاش صاف کریں', 'Try other dates, a higher price, or a lower rating.': 'دوسری تاریخیں، زیادہ قیمت یا کم ریٹنگ آزمائیں۔', 'Clear all filters': 'تمام فلٹرز صاف کریں', 'Previous': 'پچھلا', 'Next': 'اگلا',
  'Vehicles': 'گاڑیاں', 'Pickup': 'پک اپ', 'Return': 'واپسی', 'Passengers': 'مسافر', 'Type of tour': 'ٹور کی قسم', 'Type of property': 'پراپرٹی کی قسم', 'Sightseeing': 'سیر و تفریح', 'Cultural': 'ثقافتی', 'Day trip': 'ایک دن کا سفر',
  'Adventure': 'مہم جوئی', 'Trekking': 'ٹریکنگ', 'Jeep safari': 'جیپ سفاری', 'Search by name, city, or area': 'نام، شہر یا علاقے سے تلاش کریں', 'Select date': 'تاریخ منتخب کریں', 'Clear date': 'تاریخ صاف کریں', 'Maximum price': 'زیادہ سے زیادہ قیمت',
  'Add both dates to see only properties with free rooms.': 'صرف خالی کمروں والی جگہیں دیکھنے کے لیے دونوں تاریخیں درج کریں۔', 'Add both dates to see only cars that are free.': 'صرف دستیاب گاڑیاں دیکھنے کے لیے دونوں تاریخیں درج کریں۔',
  // Listing
  'Back to results': 'نتائج پر واپس', 'New listing': 'نئی لسٹنگ', 'Share': 'شیئر کریں', 'Save': 'محفوظ کریں', 'Saved': 'محفوظ', 'What this place offers': 'یہاں کیا سہولیات ہیں', 'Vehicle details': 'گاڑی کی تفصیلات', 'Car': 'گاڑی', 'Category': 'زمرہ', 'Gearbox': 'گیئر باکس',
  'Seats': 'نشستیں', 'Fuel': 'ایندھن', 'Large bags': 'بڑے بیگ', 'Trip details': 'سفر کی تفصیلات', 'Type': 'قسم', 'Duration': 'دورانیہ', 'Difficulty': 'مشکل کی سطح', 'Group size': 'گروپ کا سائز', 'Runs': 'چلتا ہے', 'Guide speaks': 'گائیڈ کی زبان',
  'Included': 'شامل', 'Not included': 'شامل نہیں', 'Itinerary': 'سفری پروگرام', 'Facilities': 'سہولیات', 'Good to know before you go': 'جانے سے پہلے جان لیں', 'Meals': 'کھانا', 'Hosted by': 'میزبان', 'The host family lives here': 'میزبان خاندان یہیں رہتا ہے', 'Guest reviews': 'مہمانوں کے تبصرے',
  'From': 'شروع', 'See places to stay': 'قیام گاہیں دیکھیں', 'This property is no longer available': 'یہ جگہ اب دستیاب نہیں', 'Children welcome': 'بچوں کو خوش آمدید', 'Children not allowed': 'بچوں کی اجازت نہیں', 'No extra beds': 'اضافی بستر نہیں', 'Pets allowed': 'پالتو جانوروں کی اجازت ہے', 'No pets': 'پالتو جانور منع ہیں',
  'Smoking allowed': 'تمباکو نوشی کی اجازت ہے', 'No smoking indoors': 'اندر تمباکو نوشی منع ہے', 'Power backup': 'بجلی کا بیک اپ', 'No backup during power cuts': 'لوڈشیڈنگ میں بیک اپ نہیں', 'Heating': 'ہیٹنگ', 'Rooms are not heated': 'کمروں میں ہیٹنگ نہیں', 'Hot water': 'گرم پانی', 'Mobile signal': 'موبائل سگنل', 'No mobile signal': 'موبائل سگنل نہیں',
  'Getting there': 'وہاں کیسے پہنچیں', 'Season': 'موسم', 'Breakfast': 'ناشتہ', 'Available': 'دستیاب', 'Parking': 'پارکنگ', 'Free': 'مفت', 'Paid': 'ادا شدہ', 'Homestay': 'ہوم اسٹے', 'Entire place': 'پوری جگہ', 'Hotel': 'ہوٹل', 'Link copied': 'لنک کاپی ہو گیا', 'On set dates': 'مقررہ تاریخوں پر', 'Any day': 'کسی بھی دن',
  'House rules': 'گھر کے اصول', 'Policies': 'پالیسیاں', 'Included in the price': 'قیمت میں شامل', 'Where the car is based': 'گاڑی کہاں موجود ہے', 'Where the tour goes': 'ٹور کہاں جاتا ہے', 'Where you’ll be': 'آپ کہاں ہوں گے', 'Message the host': 'میزبان کو پیغام بھیجیں', 'Message the partner': 'پارٹنر کو پیغام بھیجیں', 'Check availability': 'دستیابی دیکھیں', 'Details': 'تفصیلات',
  'Check-in': 'چیک اِن', 'Check-out': 'چیک آؤٹ', 'Add meals': 'کھانا شامل کریں', 'Total before any fees and taxes': 'فیس اور ٹیکس سے پہلے کل', 'Pay on arrival': 'پہنچنے پر ادائیگی', 'Adults': 'بالغ', 'Children': 'بچے', 'Rooms': 'کمرے', 'The home': 'گھر', 'Choose a room': 'کمرہ منتخب کریں', 'Sold out': 'مکمل بک', 'Does not fit your party': 'آپ کے گروپ کے لیے موزوں نہیں',
  'Reserve': 'بک کریں', 'Select dates to reserve': 'بکنگ کے لیے تاریخیں منتخب کریں', 'Pickup time': 'پک اپ کا وقت', 'Pickup place': 'پک اپ کی جگہ', 'Drop off in another place': 'کسی اور جگہ چھوڑیں', 'Departure': 'روانگی', 'Not available': 'دستیاب نہیں', 'Select a date to reserve': 'بکنگ کے لیے تاریخ منتخب کریں',
  'This is a seasonal offer. Choose a place to stay nearby and book it directly.': 'یہ موسمی پیشکش ہے۔ قریب ہی کوئی قیام گاہ منتخب کر کے براہِ راست بک کریں۔',
  // Checkout and bookings
  'Full name': 'پورا نام', 'Email address': 'ای میل ایڈریس', 'Email': 'ای میل', 'Password': 'پاس ورڈ', 'Phone number': 'فون نمبر', 'Special requests': 'خصوصی درخواستیں', 'Review and request': 'جائزہ لیں اور درخواست بھیجیں', 'Promo code': 'پرومو کوڈ', 'Remove': 'ہٹائیں', 'Apply': 'لاگو کریں', 'How would you like to pay?': 'آپ کیسے ادائیگی کرنا چاہیں گے؟',
  'Total': 'کل', 'Guest': 'مہمان', 'Meeting point': 'ملاقات کی جگہ', 'Go to My Bookings': 'میری بکنگز پر جائیں', 'Print or save as PDF': 'پرنٹ کریں یا PDF محفوظ کریں', 'Back to property': 'پراپرٹی پر واپس', 'Edit your details': 'اپنی تفصیلات میں ترمیم کریں', 'Continue to review': 'جائزے پر جائیں', 'Pay now': 'ابھی ادائیگی کریں', 'Your stay': 'آپ کا قیام', 'Your details': 'آپ کی تفصیلات', 'Review': 'جائزہ', 'Confirmed': 'تصدیق شدہ',
  'Upcoming': 'آنے والی', 'Past': 'گزشتہ', 'Cancelled': 'منسوخ', 'Completed': 'مکمل', 'View voucher': 'واؤچر دیکھیں', 'Message partner': 'پارٹنر کو پیغام', 'Request a change': 'تبدیلی کی درخواست', 'Cancel booking': 'بکنگ منسوخ کریں', 'Write a review': 'تبصرہ لکھیں', 'Accept change': 'تبدیلی قبول کریں', 'Keep my booking': 'میری بکنگ برقرار رکھیں', 'Complete payment': 'ادائیگی مکمل کریں',
  'Your next trip starts here': 'آپ کا اگلا سفر یہاں سے شروع ہوتا ہے', 'No past trips yet': 'ابھی کوئی گزشتہ سفر نہیں', 'No cancelled bookings': 'کوئی منسوخ بکنگ نہیں', 'Explore stays': 'قیام گاہیں دیکھیں', 'Discover stays': 'قیام گاہیں تلاش کریں', 'Keep your favourite places close': 'اپنی پسندیدہ جگہیں محفوظ رکھیں', 'Cancel': 'منسوخ', 'Edit': 'ترمیم', 'Add': 'شامل کریں',
  'Personal details': 'ذاتی تفصیلات', 'Login & security': 'لاگ ان اور سیکیورٹی', 'Name': 'نام', 'Phone': 'فون', 'Verified': 'تصدیق شدہ', 'Change password': 'پاس ورڈ تبدیل کریں', 'Two-step sign-in': 'دو مرحلہ لاگ ان', 'Signed-in devices': 'لاگ ان آلات', 'Delete account': 'اکاؤنٹ حذف کریں', 'Turn on': 'آن کریں', 'Turn off': 'بند کریں',
  // Sign-in
  'Welcome back': 'خوش آمدید', 'Create your account': 'اپنا اکاؤنٹ بنائیں', 'Create an account': 'اکاؤنٹ بنائیں', 'New to GBBookings?': 'GBBookings پر نئے ہیں؟', 'Already have an account?': 'پہلے سے اکاؤنٹ ہے؟', 'Forgot password?': 'پاس ورڈ بھول گئے؟', 'Remember me for 7 days': '7 دن یاد رکھیں', 'Confirm password': 'پاس ورڈ کی تصدیق', 'Send verification code': 'تصدیقی کوڈ بھیجیں', 'Reset your password': 'پاس ورڈ ری سیٹ کریں', 'Send reset link': 'ری سیٹ لنک بھیجیں', 'Back to sign in': 'لاگ ان پر واپس',
  // Footer and help
  'Subscribe to Our Newsletter': 'ہمارے نیوز لیٹر کو سبسکرائب کریں', 'Get the best travel deals, tips & inspiration straight to your inbox.': 'بہترین سفری پیشکشیں اور مشورے براہِ راست اپنے ان باکس میں پائیں۔', 'Subscribe': 'سبسکرائب', 'Enter your email address': 'اپنا ای میل درج کریں', 'Payment': 'ادائیگی', 'Contact Us': 'ہم سے رابطہ کریں', 'Need Help?': 'مدد چاہیے؟', 'Our team can help you plan your trip or sort out a booking.': 'ہماری ٹیم سفر کی منصوبہ بندی یا بکنگ میں آپ کی مدد کر سکتی ہے۔', 'Chat on WhatsApp': 'واٹس ایپ پر بات کریں',
  'Terms': 'شرائط', 'Privacy Policy': 'رازداری کی پالیسی', 'Refund Policy': 'ریفنڈ پالیسی', 'Service Policy': 'سروس پالیسی', 'Best Price Guarantee': 'بہترین قیمت کی ضمانت', 'Free Cancellation': 'مفت منسوخی', '24/7 Support': '24/7 معاونت', 'Verified Partners': 'تصدیق شدہ پارٹنرز', 'Secure Booking': 'محفوظ بکنگ', 'We ensure you get the best prices with no hidden fees.': 'ہم بغیر پوشیدہ فیس کے بہترین قیمت یقینی بناتے ہیں۔', 'Free cancellation until the day before check-in.': 'چیک اِن سے ایک دن پہلے تک مفت منسوخی۔', 'Our travel experts are always here to help.': 'ہمارے سفری ماہرین ہمیشہ مدد کے لیے موجود ہیں۔', 'Every vendor and listing is reviewed before it goes live.': 'ہر پارٹنر اور لسٹنگ شائع ہونے سے پہلے جانچی جاتی ہے۔', 'Your data is safe with our secure system.': 'آپ کا ڈیٹا ہمارے نظام میں محفوظ ہے۔',
  'Top Destinations': 'اہم مقامات', 'View All Destinations': 'تمام مقامات دیکھیں', 'Tours & Packages': 'ٹورز اور پیکجز', 'View All Packages': 'تمام پیکجز دیکھیں', 'Adventure Tours': 'مہم جوئی کے ٹورز', 'Family Tours': 'فیملی ٹورز', 'Honeymoon Packages': 'ہنی مون پیکجز', 'Jeep Safari Tours': 'جیپ سفاری ٹورز', 'Trekking Tours': 'ٹریکنگ ٹورز', 'Camping Tours': 'کیمپنگ ٹورز', 'Luxury Tours': 'لگژری ٹورز', 'Custom Tours': 'اپنی مرضی کے ٹورز', 'View All Hotels': 'تمام ہوٹل دیکھیں',
  'Hotels in Skardu': 'اسکردو کے ہوٹل', 'Hotels in Hunza': 'ہنزہ کے ہوٹل', 'Hotels in Gilgit': 'گلگت کے ہوٹل', 'Luxury Hotels': 'لگژری ہوٹل', 'Budget Hotels': 'کم بجٹ ہوٹل', 'Resorts': 'ریزورٹس', 'Guest Houses': 'گیسٹ ہاؤس', 'Cars & More': 'گاڑیاں اور مزید', 'View All Cars': 'تمام گاڑیاں دیکھیں', 'Car Rental in Skardu': 'اسکردو میں کار کرایہ', 'Car Rental in Hunza': 'ہنزہ میں کار کرایہ', 'Car Rental in Gilgit': 'گلگت میں کار کرایہ', 'With Driver': 'ڈرائیور کے ساتھ', 'Self Drive': 'خود ڈرائیو', 'Travel Guide': 'سفری رہنما', 'About Us': 'ہمارے بارے میں', 'FAQs': 'عام سوالات',
  'Skardu': 'اسکردو', 'Hunza Valley': 'وادی ہنزہ', 'Gilgit': 'گلگت', 'Shigar Valley': 'وادی شگر', 'Deosai Plains': 'دیوسائی', 'Fairy Meadows': 'فیری میڈوز', 'Naltar Valley': 'وادی نلتر', 'Attabad Lake': 'عطا آباد جھیل',
  'Help & contact': 'مدد اور رابطہ', 'Frequently asked questions': 'اکثر پوچھے جانے والے سوالات',
  // Trip assistant
  'GBBookings trip assistant': 'GBBookings سفری معاون', 'Ask me anything about your trip': 'اپنے سفر کے بارے میں کچھ بھی پوچھیں', 'Where would you like to go?': 'آپ کہاں جانا چاہیں گے؟', 'Ask about your trip…': 'اپنے سفر کے بارے میں پوچھیں…',
};

const PATTERNS: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^(\d+) results?$/, (match) => `${match[1]} نتائج`],
  [/^\/ night$/, () => '/ رات'], [/^\/ day$/, () => '/ دن'], [/^\/ person$/, () => '/ فی فرد'],
  [/^(\d+) guests?$/, (match) => `${match[1]} مہمان`],
  [/^(\d+) left$/, (match) => `${match[1]} باقی`],
  [/^Maximum price: PKR ([\d,]+\+?)$/, (match) => `زیادہ سے زیادہ قیمت: PKR ${match[1]}`],
  [/^Showing places that can take (\d+) guests? in total, across all their rooms\.$/, (match) => `وہ جگہیں جو کل ${match[1]} مہمانوں کو ٹھہرا سکتی ہیں۔`],
];

const ATTRIBUTES = ['placeholder', 'aria-label', 'title'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE']);

function toUrdu(text: string) {
  const core = text.trim();
  if (!core) return null;
  const word = WORDS[core];
  if (word) return text.replace(core, word);
  for (const [pattern, build] of PATTERNS) {
    const match = core.match(pattern);
    if (match) return text.replace(core, build(match));
  }
  return null;
}

/** Keeps the page in Urdu as it changes; the returned function puts everything back. */
export function startUrdu() {
  const texts = new Map<Text, string>();
  const attributes = new Map<Element, Map<string, string>>();

  const translateText = (node: Text) => {
    if (node.parentElement && SKIP.has(node.parentElement.tagName)) return;
    const urdu = toUrdu(node.data);
    if (urdu && urdu !== node.data) { texts.set(node, node.data); node.data = urdu; }
  };
  const translateAttributes = (element: Element) => {
    for (const name of ATTRIBUTES) {
      const value = element.getAttribute(name);
      const urdu = value && toUrdu(value);
      if (urdu) {
        if (!attributes.has(element)) attributes.set(element, new Map());
        attributes.get(element)!.set(name, value!);
        element.setAttribute(name, urdu);
      }
    }
  };
  const translateTree = (root: Node) => {
    if (root.nodeType === Node.TEXT_NODE) { translateText(root as Text); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    translateAttributes(root as Element);
    (root as Element).querySelectorAll('[placeholder],[aria-label],[title]').forEach(translateAttributes);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) translateText(walker.currentNode as Text);
  };

  translateTree(document.body);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') translateText(record.target as Text);
      else if (record.type === 'attributes') translateAttributes(record.target as Element);
      else record.addedNodes.forEach(translateTree);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });

  return () => {
    observer.disconnect();
    texts.forEach((original, node) => { node.data = original; });
    attributes.forEach((names, element) => names.forEach((original, name) => element.setAttribute(name, original)));
  };
}
