export type GatheringVenue = {
  name: string;
  tag: string;
  specs: string;
  capacity: string;
  venueType: string;
  idealFor: string;
  lead: string;
  highlights: string[];
  inclusions: string[];
  policyNotes: string[];
  image: string;
  imageAlt: string;
};

export const gatheringVenues: GatheringVenue[] = [
  {
    name: "Indoor Conference & Banquet Hall",
    tag: "Climate-Controlled Indoor",
    specs: "100 Guests · AC Hall · Round Table & Theatre",
    capacity: "100 Guests",
    venueType: "Indoor AC Hall",
    idealFor: "Banquets & Seminars",
    lead: "Climate-controlled hall with custom acoustic timber ceilings and round celebration tables, engineered for social banquets and corporate seminars.",
    highlights: [
      "Round banquet table layout accommodating up to 100 seated guests comfortably",
      "Acoustic timber ceilings with warm ambient pendant lighting designed by Astu Architects",
      "Dedicated buffet service station and separate vegetarian / non-veg kitchen access",
    ],
    inclusions: [
      "Integrated high-definition presentation projection and sound system",
      "Climate-controlled central air-conditioning with dual generator backup",
      "Dedicated banquet service staff and personal event hospitality coordinator",
    ],
    policyNotes: [
      "Zero hall-rental policy: billed strictly on transparent per-plate dining menus",
      "Prior booking required with customized catering consultation",
    ],
    image: "/assets/resort/scenes/web/gatherings-banquet-p03.webp",
    imageAlt: "Indoor conference and banquet hall with round dining tables beneath timber-framed ceiling",
  },
  {
    name: "Theatre Seminar & AV Conference Hall",
    tag: "Corporate & Presentations",
    specs: "100 Guests · Presentation Stage · Full AV Setup",
    capacity: "100 Guests",
    venueType: "Auditorium Style",
    idealFor: "Conferences & Keynotes",
    lead: "Auditorium-style theatre presentation setup tailored for executive offsites, corporate annual meetings, and product launches.",
    highlights: [
      "Tiered/theatre seating flow maximizing visibility to front presentation stage",
      "Elevated speaker dais, presenter podium, and motorized drop-down projection screen",
      "Acoustic wall paneling engineered for crystal-clear speech intelligibility",
    ],
    inclusions: [
      "High-lumen digital projector and dual wireless handheld microphones",
      "High-speed optical Wi-Fi connectivity for remote video conferencing",
      "Continuous tea/coffee and executive refreshment service support",
    ],
    policyNotes: [
      "Available for full-day and half-day corporate conference bookings",
      "Technical support team on standby throughout event proceedings",
    ],
    image: "/assets/resort/scenes/web/gatherings-theatre-p05.webp",
    imageAlt: "Conference hall configured in theatre presentation layout with stage and screen",
  },
  {
    name: "Open Banquet Lawn 1 — Standard Lawn",
    tag: "Open-Air Social Lawn",
    specs: "300 Guests · Shaded Greenery · Open Lawn",
    capacity: "300 Guests",
    venueType: "Manicured Lawn",
    idealFor: "Receptions & Sangeet",
    lead: "Spacious natural grass lawn enveloped by tropical garden borders, suited for open-air family reunions, sangeet celebrations, and twilight dining.",
    highlights: [
      "300-guest open-air seating capacity with flexible round table or cluster arrangements",
      "Perimeter botanical trees pre-wired for hanging fairy lights and lantern decor",
      "Spacious stage placement area with unobstructed sightlines from all angles",
    ],
    inclusions: [
      "Dedicated live live-coal barbecue and chaat counter preparation bays",
      "Weatherproof outdoor sound cabling and distributed ambient lighting",
      "Adjoining guest wash pavilions and accessible paved pathways",
    ],
    policyNotes: [
      "Evening music hours comply with regional hospitality outdoor regulations",
      "Zero lawn-rental fee when booked with resort dining packages",
    ],
    image: "/assets/resort/amenities/banquet-lawn.jpg",
    imageAlt: "Open-air landscaped banquet lawn decorated with round celebration tables and warm lights",
  },
  {
    name: "Open Banquet Lawn 2 — Poolside LED Lawn",
    tag: "Grand Destination Venue",
    specs: "500 Guests · Giant Outdoor LED · Poolside",
    capacity: "500 Guests",
    venueType: "Grand Poolside Lawn",
    idealFor: "Weddings & Galas",
    lead: "Grand outdoor celebration lawn situated beside the central resort pool, equipped with an outdoor giant LED screen setup for destination weddings and live performances.",
    highlights: [
      "Up to 500 guests capacity for grand wedding receptions and cultural galas",
      "Outdoor giant LED screen setup for live wedding feeds, sangeet videos, and visuals",
      "Waterfront poolside colonnade offering an iconic architectural celebration backdrop",
    ],
    inclusions: [
      "Dedicated green rooms for wedding parties and performing artists",
      "Multi-counter catering flow with live tandoor and regional culinary stations",
      "Power connectivity for high-draw professional sound and stage lighting",
    ],
    policyNotes: [
      "Prime venue for multi-day destination wedding packages",
      "Custom per-plate catering with complimentary pre-event food tasting",
    ],
    image: "/assets/resort/scenes/web/hero-pool-day-desktop-p37.jpg",
    imageAlt: "Grand poolside lawn and central water courtyard under clear daytime skies",
  },
  {
    name: "Grand Arrival Foyer & Delegate Lounge",
    tag: "Pre-Function & Welcome",
    specs: "150 Guests · High Ceilings · Reception Foyer",
    capacity: "150 Guests",
    venueType: "Pre-Function Lounge",
    idealFor: "Welcome Drinks & Registrations",
    lead: "Covered indoor reception foyer featuring high timber ceilings and upholstered seating, ideal for delegate registration and welcome mocktail hours.",
    highlights: [
      "Spacious pre-function circulation area adjacent to main conference halls",
      "Custom stone registration counters with power connectivity and display stands",
      "Upholstered lounge sofas and beverage stations for seamless guest arrivals",
    ],
    inclusions: [
      "Dedicated resort welcome staff and luggage staging assistance",
      "Welcome drink dispensers and passed canapés service area",
    ],
    policyNotes: [
      "Included complimentary with indoor conference hall bookings",
      "Direct barrier-free access from guest parking and drop-off porch",
    ],
    image: "/assets/resort/scenes/web/arrival-reception-lounge-p11.webp",
    imageAlt: "Grand luxury arrival reception lounge with timber ceilings and contemporary lounge seating",
  },
  {
    name: "Poolside Gazebo Celebration Pavilion",
    tag: "Intimate Celebrations",
    specs: "20–40 Guests · Shaded Timber · Pool Deck",
    capacity: "20–40 Guests",
    venueType: "Private Pavilion",
    idealFor: "Intimate Parties & Milestones",
    lead: "Exclusive shaded timber pavilion by the illuminated pool deck, designed for milestone birthday dinners, intimate cocktail parties, and family ceremonies.",
    highlights: [
      "Private sheltered deck space overlooking reflective pool waters",
      "Customizable long dining banquet table or lounge cocktail seating",
      "Atmospheric evening lantern illumination and dedicated sound system",
    ],
    inclusions: [
      "Dedicated chef-curated banquet or finger food sharing platters",
      "Personal bar and beverage attendant assigned exclusively to your group",
    ],
    policyNotes: [
      "Reservations available for lunch and evening celebration slots",
      "Minimum group size of 15 guests for private gazebo reservation",
    ],
    image: "/assets/resort/scenes/web/dusk-pool-candidate-p38.jpg",
    imageAlt: "Poolside celebration gazebo illuminated with warm evening lanterns reflecting across pool water",
  },
];

