import { Listing } from './types';

export const INITIAL_LISTINGS: Listing[] = [
  {
    id: 'h-1',
    type: 'hotel',
    title: 'Luxus Hunza Resort & Spa',
    location: 'Attabad Lake, Hunza Valley',
    price: 35000, // PKR per night
    rating: 4.9,
    reviewsCount: 148,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Perched directly on the edge of the mesmerizing turquoise waters of Attabad Lake, Luxus Hunza offers a breathtaking luxury experience. Watch the sunset over the Karakoram peaks from your private heated balcony, relax in our world-class infinity pool, and indulge in contemporary fusion dining featuring local Hunza ingredients.',
    featured: true,
    hotelSpecs: {
      roomsAvailable: 12,
      amenities: ['Heated Balcony', 'Infinity Pool', 'Spa & Wellness Center', 'Lakeside Fine Dining', 'High-speed Wi-Fi', 'Helipad Access'],
      hotelType: 'Luxury Resort'
    }
  },
  {
    id: 'h-2',
    type: 'hotel',
    title: 'Shangrila Resort Skardu',
    location: 'Lower Kachura Lake, Skardu',
    price: 28000,
    rating: 4.8,
    reviewsCount: 215,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Often referred to as "Heaven on Earth", Shangrila Resort Skardu is nestled among some of the world’s highest peaks, encircling the pristine heart-shaped Lower Kachura Lake. It offers signature cottage accommodation, lush terraced fruit orchards, and boating excursions under towering granite cliffs.',
    featured: true,
    hotelSpecs: {
      roomsAvailable: 8,
      amenities: ['Lakeside Cottages', 'Private Boating', 'Orchard Walks', 'Free Airport Shuttle', 'Mini-Golf Course', 'Traditional Restaurant'],
      hotelType: 'Nature Resort'
    }
  },
  {
    id: 'h-3',
    type: 'hotel',
    title: 'Serena Hotel Islamabad',
    location: 'G-5 Sector, Islamabad',
    price: 45000,
    rating: 4.9,
    reviewsCount: 382,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Combining local Islamic architecture with modern state-of-the-art luxury, the Serena Hotel Islamabad stands in six acres of lush gardens with views of the Margalla Hills. Known for its high-level security, elite conference centers, and exquisite multi-cuisine banquet halls.',
    featured: false,
    hotelSpecs: {
      roomsAvailable: 25,
      amenities: ['Executive Lounges', 'Maisha Spa & Gym', 'Diplomatic Enclave Shuttle', 'Margalla View Rooftop', 'Outdoor Pool', '24/7 Butler Service'],
      hotelType: '5-Star Business & Heritage Hotel'
    }
  },
  {
    id: 'h-4',
    type: 'hotel',
    title: 'Malam Jabba Ski Resort Hotel',
    location: 'Ski Slopes, Malam Jabba, Swat',
    price: 24000,
    rating: 4.6,
    reviewsCount: 94,
    image: 'https://images.unsplash.com/photo-1518098268026-4e43a1a009de?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1518098268026-4e43a1a009de?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Experience Pakistan’s premier ski destination in style. Offering direct ski-in/ski-out access to the Malam Jabba chairlifts, cozy timber rooms with central heating, and a beautiful fireside lounge to warm up after a day on the slopes.',
    featured: false,
    hotelSpecs: {
      roomsAvailable: 15,
      amenities: ['Ski-in / Ski-out Access', 'Chairlift Passes', 'Heated Rooms', 'Fireside Lounge', 'Ski Rental Shop', 'Indoor Activity Zone'],
      hotelType: 'Alpine Ski Resort'
    }
  },
  {
    id: 'hs-1',
    type: 'homestay',
    title: 'Hunza Woodside Cottage',
    location: 'Altit, Karimabad, Hunza Valley',
    price: 12000,
    rating: 4.8,
    reviewsCount: 42,
    image: 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'An authentic wooden cottage nestled in Altit village, offering unparalleled mountain views of Ultar Sar and Ladyfinger Peak. Enjoy traditional home-cooked apricot soup and salt tea with local host Karim and his family.',
    featured: true,
    homestaySpecs: {
      roomsAvailable: 2,
      amenities: ['Mountain View balcony', 'Local Host Kitchen', 'Fireside Stove', 'Complimentary Apricot Tea', 'High-speed Wi-Fi', 'Orchard Parking'],
      houseRules: ['No smoking indoors', 'Respect local family culture', 'Quiet after 10 PM'],
      hostName: 'Karim Balti',
      hostImage: 'KB',
      experienceType: 'Mountain View'
    }
  },
  {
    id: 'hs-2',
    type: 'homestay',
    title: 'Kachura Lakeside Lodge',
    location: 'Upper Kachura Lake, Skardu',
    price: 8500,
    rating: 4.9,
    reviewsCount: 29,
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Relax in a traditional wood-and-stone cabin right beside the tranquil blue waters of Upper Kachura Lake. Perfect for fishing, boating, and enjoying local Balti hospitality under the towering Karakoram peaks.',
    featured: true,
    homestaySpecs: {
      roomsAvailable: 3,
      amenities: ['Lakeside Deck', 'Boating Access', 'Local Balti Dinners', 'Fireside Yard', 'Fresh Alpine Trout Meal Option', 'Free Fishing Rods'],
      houseRules: ['Keep lakeside clean', 'No loud music near water', 'Check-in before sunset'],
      hostName: 'Muhammad Ali',
      hostImage: 'MA',
      experienceType: 'Lakeside Stays'
    }
  },
  {
    id: 'hs-3',
    type: 'homestay',
    title: 'Shigar Heritage Homestay',
    location: 'Shigar Valley, Skardu',
    price: 14000,
    rating: 4.7,
    reviewsCount: 18,
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'A beautifully restored 200-year-old traditional Balti stone house in Shigar Valley. Experience authentic culture, organic cherry orchard walks, and traditional balti bread baking classes.',
    featured: true,
    homestaySpecs: {
      roomsAvailable: 2,
      amenities: ['Organic Orchard Walks', 'Heritage Stone Architecture', 'Traditional Balti Cooking Classes', 'Complimentary Local Guide', 'Clay Fireplace'],
      houseRules: ['Remove shoes inside', 'No alcohol', 'Respect historical furniture'],
      hostName: 'Aisha Bibi',
      hostImage: 'AB',
      experienceType: 'Local Culture'
    }
  },
  {
    id: 'hs-4',
    type: 'homestay',
    title: 'Passu Peaks Cozy Cabin',
    location: 'Passu, Gojal, Hunza Valley',
    price: 10500,
    rating: 4.9,
    reviewsCount: 35,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Enjoy stunning, unobstructed views of the legendary Passu Cones from your cozy timber cabin balcony. Includes a traditional clay-oven fireplace and complimentary organic apricot jam breakfast.',
    featured: true,
    homestaySpecs: {
      roomsAvailable: 4,
      amenities: ['Passu Cones View Deck', 'Traditional Clay Oven', 'Complimentary Local Breakfast', 'Hiking Guide Service', 'Hot Geyser Water'],
      houseRules: ['Respect water conservation', 'No pets', 'Quiet hours from 10:00 PM'],
      hostName: 'Ghulam Rasool',
      hostImage: 'GR',
      experienceType: 'Mountain View'
    }
  },
  {
    id: 'hs-5',
    type: 'homestay',
    title: 'Gojal Valley Budget Homestead',
    location: 'Gulmit, Gojal, Hunza Valley',
    price: 5000,
    rating: 4.6,
    reviewsCount: 15,
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'An affordable, cozy stone room hosted by a lovely local Wakhi family in historic Gulmit. Experience farming culture, watch traditional carpet weaving, and enjoy home-grown organic vegetables.',
    featured: false,
    homestaySpecs: {
      roomsAvailable: 1,
      amenities: ['Traditional Carpet Weaving Experience', 'Shared Wakhi Kitchen', 'Local Farming Tours', 'Budget Friendly Rooms', 'Free Herbal Teas'],
      houseRules: ['Help clean up after dining', 'Respect Wakhi traditions', 'Check-out at 10:00 AM'],
      hostName: 'Zehra Wakhi',
      hostImage: 'ZW',
      experienceType: 'Budget Friendly'
    }
  },
  {
    id: 'c-1',
    type: 'car',
    title: 'Toyota Land Cruiser V8 4x4',
    location: 'Skardu, Gilgit Baltistan',
    price: 32000,
    rating: 4.9,
    reviewsCount: 156,
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'The ultimate luxury rugged 4x4 SUV, perfect for Skardu, Hunza, Deosai Plains, and any mountain terrain. Equipped with off-road suspension and climate control.',
    featured: true,
    carSpecs: {
      category: 'SUV',
      transmission: 'Automatic',
      seats: 7,
      fuelType: 'Diesel',
      withDriver: true
    }
  },
  {
    id: 'c-2',
    type: 'car',
    title: 'Toyota Fortuner Sigma 4',
    location: 'Skardu, Gilgit Baltistan',
    price: 18000,
    rating: 4.8,
    reviewsCount: 198,
    image: 'https://images.unsplash.com/photo-1606016159991-dfe4f974be5c?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1606016159991-dfe4f974be5c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'A powerful and popular 4x4 companion for Karakoram mountain drives, combining modern interior luxury and high terrain capability.',
    featured: true,
    carSpecs: {
      category: 'SUV',
      transmission: 'Automatic',
      seats: 7,
      fuelType: 'Diesel',
      withDriver: true
    }
  },
  {
    id: 'c-3',
    type: 'car',
    title: 'Toyota Hiace Grand Cabin',
    location: 'Skardu, Gilgit Baltistan',
    price: 25000,
    rating: 4.7,
    reviewsCount: 112,
    image: 'https://images.unsplash.com/photo-1520050206274-a1ae446cb3cc?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1520050206274-a1ae446cb3cc?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'A spacious, executive, and highly comfortable grand cabin van. Ideal for group tours, family trips, and long inter-city mountain road trips.',
    featured: false,
    carSpecs: {
      category: 'Van',
      transmission: 'Automatic',
      seats: 14,
      fuelType: 'Diesel',
      withDriver: true
    }
  },
  {
    id: 'c-4',
    type: 'car',
    title: 'Suzuki Cultus VXL',
    location: 'Skardu, Gilgit Baltistan',
    price: 3500,
    rating: 4.6,
    reviewsCount: 98,
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'Highly economical and compact hatchback, perfect for smooth city travel, market runs, and budget-conscious travelers.',
    featured: false,
    carSpecs: {
      category: 'Hatchback',
      transmission: 'Manual',
      seats: 4,
      fuelType: 'Petrol',
      withDriver: false
    }
  },
  {
    id: 'c-5',
    type: 'car',
    title: 'Honda Civic Oriel',
    location: 'Skardu, Gilgit Baltistan',
    price: 7500,
    rating: 4.5,
    reviewsCount: 98,
    image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=1200&q=80'
    ],
    description: 'A stylish, high-performing luxury sedan. Ideal for inter-city travel and smooth paved Karakoram highways with sunroof and climate control.',
    featured: false,
    carSpecs: {
      category: 'Sedan',
      transmission: 'Automatic',
      seats: 5,
      fuelType: 'Petrol',
      withDriver: false
    }
  },
  {
    id: 't-1',
    type: 'tour',
    title: 'Autumn Odyssey in Hunza Valley',
    location: 'Gilgit, Hunza, Attabad, Passu',
    price: 85000, // PKR per package
    rating: 4.9,
    reviewsCount: 156,
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Witness the valleys of northern Pakistan set ablaze with golden poplars, deep orange apricots, and red cherry trees during the magical Autumn season. This all-inclusive premium tour guides you through historical forts, pristine lakes, and legendary mountain views with full accommodation, private 4x4 transport, and local guides.',
    featured: true,
    tourSpecs: {
      durationDays: 7,
      maxGroupSize: 12,
      difficulty: 'Easy',
      included: ['4-Star Lakeside Hotel Stay', 'Daily Buffet Breakfast & Dinner', 'Private Prado SUV with Driver', 'Historical Fort Entry Tickets', 'Lakeside Boating Trip', 'Professional Tour Guide'],
      itinerary: [
        { day: 1, title: 'Arrival in Gilgit & Scenic Drive to Hunza', desc: 'Land at Gilgit airport, meet your guide, and drive along the Karakoram Highway to Hunza. Stop at the collision point of continental plates.' },
        { day: 2, title: 'Karimabad Explorations & Baltit Fort', desc: 'Visit the 700-year-old Baltit Fort, explore the historic Karimabad Bazaar, and watch the sunset from Eagle’s Nest.' },
        { day: 3, title: 'Attabad Lake & Passu Suspension Bridge', desc: 'Boating on the turquoise Attabad Lake, drive past the majestic Cathedral Peaks, and walk on the thrilling Passu Bridge.' },
        { day: 4, title: 'Khunjerab Pass (Pakistan-China Border)', desc: 'Drive up to the world’s highest paved border cross at 4,693 meters. Spot Himalayan Ibex and enjoy the snow.' },
        { day: 5, title: 'Altit Fort & Royal Gardens Tour', desc: 'Explore the Altit village and its 1100-year-old fort. Sip local walnut cake at the organic gardens cafe.' },
        { day: 6, title: 'Hoper Glacier & Nagar Valley Excursion', desc: 'Journey into the neighboring Nagar Valley to see the dark Hoper Glacier and experience Nagar hospitality.' },
        { day: 7, title: 'Departure from Gilgit', desc: 'Drive back to Gilgit airport for your flight back to Islamabad with memories of a lifetime.' }
      ]
    }
  },
  {
    id: 't-2',
    type: 'tour',
    title: 'Deosai Plateau & Skardu Expedition',
    location: 'Skardu, Deosai, Cold Desert, Shigar',
    price: 95000,
    rating: 4.8,
    reviewsCount: 112,
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
    ],
    description: 'Explore Skardu, the gateway to the mighty Karakoram giants. This premium expedition includes traversing Deosai National Park (the "Land of Giants", the world’s second-highest plateau), stargazing in the cold desert of Katpana, and staying in the historic Shigar Fort.',
    featured: true,
    tourSpecs: {
      durationDays: 6,
      maxGroupSize: 10,
      difficulty: 'Moderate',
      included: ['Luxury Heritage Resort Stays', 'Full Board Meal Plan (Breakfast, Lunch, Dinner)', 'Dedicated 4x4 Prado Cruisers', 'Deosai National Park Permits', 'Katpana Desert Glamping Evening', 'Local Balti Culturist Guide'],
      itinerary: [
        { day: 1, title: 'Welcome to Skardu & Kachura Lakes', desc: 'Arrive in Skardu, visit Lower Kachura (Shangrila) and Upper Kachura Lake. Optional boating and alpine trout lunch.' },
        { day: 2, title: 'Deosai National Park Wilderness Safari', desc: 'Spend the day roaming the endless plains of Deosai at 4,114 meters. Visit Sheosar Lake and look out for Himalayan Brown Bears.' },
        { day: 3, title: 'Historic Shigar Valley & Royal Fort', desc: 'Drive to Shigar Valley, explore the beautifully restored 17th-century Serena Shigar Fort, and walk around local cherry orchards.' },
        { day: 4, title: 'Katpana Sand Dunes & Stargazing', desc: 'Witness high-altitude white sand dunes surrounded by snowcapped peaks. Glamping and bonfire barbecue under the Milky Way.' },
        { day: 5, title: 'Manthoka Waterfall & Indus Confluence', desc: 'Drive to the majestic 180-ft Manthoka waterfall, then stand where the Indus and Shigar Rivers collide.' },
        { day: 6, title: 'Fly back to Capital', desc: 'Transfer to Skardu airport for your scenic flight alongside Nanga Parbat back to Islamabad.' }
      ]
    }
  }
];
export const MOCK_REVIEWS = [
  { id: 'r-1', listingId: 'h-1', author: 'Dr. Sarah Khan', rating: 5, comment: 'Hands down the most beautiful view in Pakistan. The room opens up directly to the azure lake. Absolute luxury and hospitality!', createdAt: '2026-06-15' },
  { id: 'r-2', listingId: 'h-1', author: 'Kamran Alvi', rating: 5, comment: 'The food is incredible, the heated balcony kept us cozy even as temperature dropped. Fully worth the price.', createdAt: '2026-06-20' },
  { id: 'r-3', listingId: 'c-1', author: 'Zainab Jameel', rating: 5, comment: 'Prado was in brand new condition, and our driver Mr. Tariq was exceptionally skilled at handling the treacherous roads to Passu.', createdAt: '2026-06-10' },
  { id: 'r-4', listingId: 't-1', author: 'Richard Benson', rating: 5, comment: 'The autumn colors are out of this world! Every detail was expertly handled by GBBookings. Highly recommend local host services.', createdAt: '2026-06-25' }
];
export const PAKISTAN_FAQ = [
  { q: "Is it safe to travel to northern Pakistan?", a: "Yes, northern regions like Hunza and Skardu are highly peaceful, safe, and welcome thousands of international and local tourists yearly. The local hospitality is legendary!" },
  { q: "When is the best time to visit Hunza and Skardu?", a: "Spring (April-May) for cherry blossoms, Summer (June-August) for pleasant weather/hiking, and Autumn (October-November) for breathtaking golden foliage. Winter is great for snow sports." },
  { q: "What payment methods do you accept?", a: "We support Visa/Mastercard credit cards, as well as Pakistans primary digital wallets: JazzCash and Easypaisa." },
  { q: "Are drivers included with car rentals?", a: "Most of our mountain-terrain SUVs (like Toyota Prado or Land Cruiser) default to Chauffeur-driven for safety on mountain roads. Urban sedans can be hired for self-drive." }
];
