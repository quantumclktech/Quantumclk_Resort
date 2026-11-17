export type ExperienceCategory = {
  name: string;
  tag: string;
  specs: string;
  duration: string;
  idealFor: string;
  venue: string;
  lead: string;
  highlights: string[];
  inclusions: string[];
  bookingNotes: string[];
  image: string;
  imageAlt: string;
  /* Added for the day track (unit 3.23). `when` is read off this entry's own
   * booking notes; `order` sorts the day; `sketch` replaces a stock photo
   * that does not show this resort (OPEN_QUESTIONS Q-020) with a drawing. */
  when?: string;
  phase?: "day" | "sunset" | "evening";
  order?: number;
  sketch?: "zipline" | "picnic" | "bonfire" | "cinema";
};

export const resortExperiences: ExperienceCategory[] = [
  {
    name: "Romantic Candlelight Dinner",
    when: "7:30 – 11 PM", phase: "evening", order: 6,
    tag: "Couples & Anniversaries",
    specs: "Couples · 2 Hours · Poolside Gazebo",
    duration: "2 Hours",
    idealFor: "Couples",
    venue: "Poolside Gazebo",
    lead: "An intimate candlelit dining experience set within an illuminated pool gazebo, featuring customized chef's culinary menus and personal butler service.",
    highlights: [
      "Exclusive private dining gazebo adorned with ambient candlelight and floral decor",
      "Curated 4-course gourmet set dinner customized to dietary preferences",
      "Welcome signature sparkling coolers and artisanal dessert platter",
    ],
    inclusions: [
      "Dedicated personal butler service throughout the dinner",
      "Choice of pure vegetarian or multi-cuisine gourmet menu",
      "Ambient romantic background acoustics and customized table message",
    ],
    bookingNotes: [
      "Prior reservation required minimum 24 hours in advance",
      "Available nightly from 07:30 PM to 11:00 PM",
    ],
    image: "/assets/resort/scenes/web/dusk-pool-candidate-p38.jpg",
    imageAlt: "Golden Hills Resort poolside candlelight gazebo illuminated at dusk",
  },
  {
    name: "Poolside Sundowner Date",
    when: "5 – 7 PM", phase: "sunset", order: 4,
    tag: "Couples & Milestones",
    specs: "Couples · 2 Hours · Pool Deck Loungers",
    duration: "2 Hours",
    idealFor: "Couples",
    venue: "Pool Deck",
    lead: "Reserved double loungers on the scenic pool deck during golden hour with artisan savory platters and hand-crafted refreshments.",
    highlights: [
      "Reserved double pool daybed loungers with unobstructed sunset garden views",
      "Artisanal Mediterranean & regional savory finger tapas platter",
      "Signature chilled mocktail or beverage cooler pairing",
    ],
    inclusions: [
      "Chilled face mist towels and dedicated poolside refreshment attendant",
      "Complimentary pool access during operating hours",
    ],
    bookingNotes: [
      "Hosted daily during sunset golden hour (05:00 PM – 07:00 PM)",
      "Advance booking recommended for poolside deck allocation",
    ],
    image: "/assets/resort/scenes/web/cottage-pool-terrace-p34.jpg",
    imageAlt: "Covered timber pool terrace with relaxation double daybed loungers",
  },
  {
    name: "Under-the-Stars Movie Night",
    when: "Select evenings", phase: "evening", order: 7, sketch: "cinema",
    tag: "Families & Couples",
    specs: "All Guests · 3–4 Hours · Butterfly Lawn",
    duration: "3–4 Hours",
    idealFor: "Families & Couples",
    venue: "Butterfly Lawn",
    lead: "Private open-air cinema experience under starry skies with plush lawn seating, freshly popped gourmet popcorn, and warm snacks.",
    highlights: [
      "High-definition outdoor cinema projection screen under clear hillside skies",
      "Plush seating setup with beanbags, floor rugs, and cozy fleece blankets",
      "Unlimited freshly popped butter popcorn and assorted finger appetizers",
    ],
    inclusions: [
      "Curated selection of classic cinema, family animation, or guest-requested titles",
      "Warm beverage station serving hot chocolate, spiced teas, and coffees",
    ],
    bookingNotes: [
      "Weather-permitting seasonal experience available on select evenings",
      "Private screening slots available for family reunions or private groups",
    ],
    image: "/assets/resort/amenities/outdoor-movie.jpg",
    imageAlt: "Open-air outdoor cinema movie night with beanbags on the lawn under fairy lights",
  },
  {
    name: "Starlit Campfire & Acoustic Gathering",
    when: "7 – 11 PM", phase: "evening", order: 5, sketch: "bonfire",
    tag: "Families & Groups",
    specs: "Groups & Families · 4 Hours · Butterfly Lawn",
    duration: "4 Hours",
    idealFor: "Groups & Families",
    venue: "Campfire Pit",
    lead: "Atmospheric evening campfire gathering with roasted barbecue skewers, warm blankets, and curated acoustic ambient music.",
    highlights: [
      "Dedicated stone campfire pit surrounded by comfortable circular seating",
      "Live live-coal barbecue skewers with paneer, seasonal vegetables, or kebabs",
      "Acoustic instrumental background music and campfire storytelling vibe",
    ],
    inclusions: [
      "Complimentary roasted marshmallow and s'mores kit for children",
      "Hot regional spiced beverages and evening finger snacks",
    ],
    bookingNotes: [
      "Campfires lighted nightly from 07:00 PM to 11:00 PM",
      "Private fire pits available for cottage enclave guests upon request",
    ],
    image: "/assets/resort/amenities/bonfire-walks.jpg",
    imageAlt: "Campfire in the woods surrounded by cozy chairs under twilight skies",
  },
  {
    name: "Gourmet Garden & Lawn Picnic",
    when: "11 AM – 4 PM", phase: "day", order: 3, sketch: "picnic",
    tag: "Families & Leisure",
    specs: "Families & Friends · 4 Hours · Manicured Lawns",
    duration: "4 Hours",
    idealFor: "Families",
    venue: "Manicured Lawns",
    lead: "A relaxed afternoon picnic spread laid out on shaded lawns with a curated gourmet hamper, woven rugs, and outdoor lawn games.",
    highlights: [
      "Woven hamper basket packed with artisanal sandwiches, fruit tarts, and cheeses",
      "Shaded lawn setup with Bohemian rugs, bolster cushions, and low tables",
      "Outdoor games kit including badminton, croquet, frisbee, and giant jenga",
    ],
    inclusions: [
      "Freshly squeezed tropical juices and thermos of single-origin coffee or tea",
      "Dedicated resort attendant for hamper setup and beverage refills",
    ],
    bookingNotes: [
      "Available between 11:00 AM and 04:00 PM daily",
      "Minimum 4 hours advance notice required for fresh hamper preparation",
    ],
    image: "/assets/resort/amenities/family-picnic.jpg",
    imageAlt: "Luxury picnic spread on green lawn with wicker basket, cushions, and food spread",
  },
  {
    name: "Adventure Sports Circuit",
    when: "10 AM – 5 PM", phase: "day", order: 2, sketch: "zipline",
    tag: "Friends & Corporate Teams",
    specs: "Groups & Active Guests · 2–4 Hours · Activity Zone",
    duration: "2–4 Hours",
    idealFor: "Active & Corporate",
    venue: "Adventure Arena",
    lead: "Adrenaline-charged activity circuit featuring Aerial Sky Cycling suspended over terrain, high-glide Zipline, and obstacle trails.",
    highlights: [
      "Aerial Sky Cycling track suspended above open resort greenery",
      "High-speed glide Zipline crossing landscaped terrain contours",
      "Supervised obstacle challenge course designed for friendly team competitions",
    ],
    inclusions: [
      "Full safety harness equipment certified to international climbing standards",
      "Dedicated certified adventure marshals and first-aid response team",
    ],
    bookingNotes: [
      "Operating daily from 10:00 AM to 05:00 PM",
      "Included in select corporate retreat and full-day outing packages",
    ],
    image: "/assets/resort/amenities/adventure-sports-circuit.jpg",
    imageAlt: "Aerial sky cycling and adventure sports circuit suspended above resort grounds",
  },
  {
    name: "Full-Day Outing Experience",
    when: "10 AM – 5 PM", phase: "day", order: 1,
    tag: "All-Inclusive Day Package",
    specs: "Groups & Day Visitors · 10:00 AM – 05:00 PM · Resort Grounds",
    duration: "7 Hours",
    idealFor: "Day Visitors & Groups",
    venue: "Full Resort Grounds",
    lead: "All-inclusive full-day getaway package bundled with comprehensive pool access, rain dance sessions, adventure sports, and three curated dining spreads.",
    highlights: [
      "Unlimited access to freshwater swimming pool, splash zone, and rain dance deck",
      "Full indoor recreation: snooker, table tennis, carrom, chess, and VR games",
      "Aerial Sky Cycling and Zipline adventure glides included",
    ],
    inclusions: [
      "Three bundled meals: Welcome Breakfast, Multi-Cuisine Buffet Lunch, and High Tea",
      "Complimentary towel service and air-conditioned changing pavilions",
      "Guarded parking and full core resort infrastructure support",
    ],
    bookingNotes: [
      "Operational hours: 10:00 AM – 05:00 PM daily",
      "Group discounts available for gatherings of 15+ guests",
    ],
    image: "/assets/resort/scenes/web/hero-pool-day-desktop-p37.jpg",
    imageAlt: "Golden Hills Resort central infinity pool and sunny day courtyard",
  },
];

