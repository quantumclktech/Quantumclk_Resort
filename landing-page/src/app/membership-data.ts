export type PrivilegeItem = {
  title: string;
  count: number;
  type: "Voucher" | "Coupon";
  detail: string;
  badge?: string;
};

export type MembershipCategory = {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  lead: string;
  sceneId: string;
  vouchersCount: number;
  couponsCount: number;
  totalBenefits: number;
  iconName: "BedDouble" | "AdventureCompass" | "Utensils" | "WineGlass" | "Users" | "SpaLotus";
  colorAccent: string;
  highlights: string[];
  privileges: PrivilegeItem[];
  redemptionTerms: string[];
};

export const membershipCategories: MembershipCategory[] = [
  {
    id: "rooms",
    name: "Accommodations & Stays",
    shortName: "Stays",
    tagline: "12 Exclusive Stay Vouchers",
    lead: "Experience complimentary luxury nights, buy-one-get-one weekend getaways, and half-price cottage escapes.",
    sceneId: "room-queen-bed-p06",
    vouchersCount: 12,
    couponsCount: 0,
    totalBenefits: 12,
    iconName: "BedDouble",
    colorAccent: "#b8965a",
    highlights: [
      "2 100% Complimentary Room Nights (Free Stay)",
      "5 Book 1 Night & Avail 2nd Night Free (BOGO Stay)",
      "5 Book 1 Night & Avail 2nd Night at 50% Off",
    ],
    privileges: [
      {
        title: "Complimentary Room Nights",
        count: 2,
        type: "Voucher",
        detail: "Two room nights completely free of charge. Applicable on Premium Queen / Twin rooms or equivalent category.",
        badge: "100% Free",
      },
      {
        title: "Stay 1 Night, Avail 2nd Night Free",
        count: 5,
        type: "Voucher",
        detail: "Book any one room night at standard tariff and receive the consecutive second night complimentary.",
        badge: "Buy 1 Get 1 Free",
      },
      {
        title: "Stay 1 Night, Avail 2nd Night at 50% Off",
        count: 5,
        type: "Voucher",
        detail: "Book any room night and unlock a flat 50% discount on your second consecutive night.",
        badge: "50% Savings",
      },
    ],
    redemptionTerms: [
      "Advance reservation of at least 48 hours is mandatory for room voucher redemption.",
      "Valid on Sunday through Friday stays. Excludes high-demand national holiday eves (subject to prior club confirmation).",
      "Vouchers are transferable to immediate family and nominated corporate guests.",
    ],
  },
  {
    id: "day-outing",
    name: "Full-Day Outings & Recreation",
    shortName: "Day Outing",
    tagline: "10 Vouchers + 15 Coupons (25 Passes)",
    lead: "Full-day access to swimming pools, rain dance mist arena, sky cycling, zipline, and outdoor adventure grounds.",
    sceneId: "hero-pool-day-desktop-p37",
    vouchersCount: 10,
    couponsCount: 15,
    totalBenefits: 25,
    iconName: "AdventureCompass",
    colorAccent: "#2e6a4f",
    highlights: [
      "10 Complimentary Full-Day Outing Passes",
      "10 One + One (1+1) Day Outing Passes",
      "5 50% Discount Coupons (Valid on up to 10 entries each)",
    ],
    privileges: [
      {
        title: "Complimentary Day Outing Passes",
        count: 10,
        type: "Voucher",
        detail: "100% free access to resort recreational facilities from 10:00 AM to 05:00 PM.",
        badge: "100% Free",
      },
      {
        title: "One + One (1+1) Day Outing Passes",
        count: 10,
        type: "Coupon",
        detail: "Pay for one entry ticket and receive the second entry completely complimentary.",
        badge: "1 + 1 Free",
      },
      {
        title: "50% Discount Vouchers (Max 10 entries each)",
        count: 5,
        type: "Coupon",
        detail: "Flat 50% discount per coupon for groups up to 10 visitors. Perfect for family reunions or friend squads.",
        badge: "Group 50% Off",
      },
    ],
    redemptionTerms: [
      "Includes swimming pool, rain dance arena, sky cycling, zipline, children's park, and indoor recreation center.",
      "Prior notification requested for groups exceeding 8 pax.",
      "Appropriate swimwear is required for pool and rain dance access.",
    ],
  },
  {
    id: "fb-buffets",
    name: "Gourmet Buffets & Breakfasts",
    shortName: "Buffets & F&B",
    tagline: "15 Vouchers + 20 Coupons (35 Benefits)",
    lead: "Delight in farm-fresh plantation breakfasts, lavish weekend brunches, and ₹5,000 in dining gift certificates.",
    sceneId: "dining-veg-seating-p13",
    vouchersCount: 15,
    couponsCount: 20,
    totalBenefits: 35,
    iconName: "Utensils",
    colorAccent: "#c28834",
    highlights: [
      "10 Complimentary Breakfast Buffets",
      "10 Lunch Buffet 1 + 1 Passes",
      "5 Complimentary Gift Certificates worth ₹1,000/- each",
      "10 Weekend Brunch One + One (1 + 1) Passes",
    ],
    privileges: [
      {
        title: "Complimentary Breakfast Vouchers",
        count: 10,
        type: "Voucher",
        detail: "Enjoy 10 separate wholesome buffet breakfasts featuring live South Indian counters and farm-fresh bakery items.",
        badge: "100% Free",
      },
      {
        title: "Lunch Buffet — 1 + 1",
        count: 10,
        type: "Coupon",
        detail: "Purchase one executive lunch buffet and receive the second guest's buffet complimentary.",
        badge: "1 + 1 Free",
      },
      {
        title: "Dining Gift Certificates (₹1,000/- each)",
        count: 5,
        type: "Voucher",
        detail: "Direct cash vouchers worth ₹5,000 total redeemable towards any food and non-alcoholic beverage billing.",
        badge: "₹5,000 Value",
      },
      {
        title: "Weekend Brunch — One + One",
        count: 10,
        type: "Coupon",
        detail: "BOGO passes for our Saturday and Sunday signature poolside brunch spreads.",
        badge: "1 + 1 Free",
      },
    ],
    redemptionTerms: [
      "Valid at Pure Vegetarian Restaurant and Multi-Cuisine Dining outlets.",
      "Breakfast served 07:30 AM – 10:30 AM; Lunch served 12:30 PM – 03:30 PM.",
      "Gift certificates can be clubbed up to 2 certificates per dining table bill.",
    ],
  },
  {
    id: "a-la-carte",
    name: "A La Carte Dining",
    shortName: "A La Carte",
    tagline: "5 Vouchers + 30 Coupons (35 Benefits)",
    lead: "Course-by-course 1+1 indulgences across gourmet soups, signature tandoor starters, main dishes, and hand-crafted desserts.",
    sceneId: "dining-non-veg-aisle-p07",
    vouchersCount: 5,
    couponsCount: 30,
    totalBenefits: 35,
    iconName: "Utensils",
    colorAccent: "#965b2e",
    highlights: [
      "10 Starter / Soup 1 + 1 (5 Lunch | 5 Dinner)",
      "10 Main Course 1 + 1 (5 Lunch | 5 Dinner)",
      "10 Dessert 1 + 1 (5 Lunch | 5 Dinner)",
      "5 50% Flat Discount Vouchers (Min bill ₹4,000/-)",
    ],
    privileges: [
      {
        title: "Starter / Soup — 1 + 1",
        count: 10,
        type: "Coupon",
        detail: "Order any artisanal starter or soup and get the second of equal or lesser value complimentary (5 Lunch | 5 Dinner).",
        badge: "5 Lunch · 5 Dinner",
      },
      {
        title: "Main Course — 1 + 1",
        count: 10,
        type: "Coupon",
        detail: "Order any main course delicacy and get another main course free (5 Lunch | 5 Dinner).",
        badge: "5 Lunch · 5 Dinner",
      },
      {
        title: "Gourmet Dessert — 1 + 1",
        count: 10,
        type: "Coupon",
        detail: "Order any signature resort dessert or gelato and receive a second dessert complimentary (5 Lunch | 5 Dinner).",
        badge: "5 Lunch · 5 Dinner",
      },
      {
        title: "50% Discount on Min Bill of ₹4,000/-",
        count: 5,
        type: "Voucher",
        detail: "Enjoy a flat half-price discount on any substantial dining bill exceeding ₹4,000/-.",
        badge: "50% Mega Savings",
      },
    ],
    redemptionTerms: [
      "Coupons are split evenly between afternoon lunch and evening dinner service.",
      "Valid for dine-in guests at all resort dining venues.",
      "Cannot be combined with other ongoing promotional happy hour offers.",
    ],
  },
  {
    id: "celebrations",
    name: "Celebrations & Banquets",
    shortName: "Celebrations",
    tagline: "11 High-Value Vouchers",
    lead: "Privilege discounts on celebrations, kitty parties with free buffets, and up to 6 complimentary rooms with banquet bookings.",
    sceneId: "gatherings-banquet-p03",
    vouchersCount: 11,
    couponsCount: 0,
    totalBenefits: 11,
    iconName: "Users",
    colorAccent: "#385e49",
    highlights: [
      "25% Discount on 30 Pax Celebrations (2 Vouchers)",
      "30% Discount on 100 Pax Celebrations (1 Voucher)",
      "5 Kitty Party Vouchers with 2 Free Buffets each",
      "Complimentary Rooms with Banquets (Up to 6 Rooms Free!)",
    ],
    privileges: [
      {
        title: "30 Pax Party — 25% Discount",
        count: 2,
        type: "Voucher",
        detail: "Flat 25% off on total party package for birthdays, anniversaries, or corporate team dinners of 30 guests.",
        badge: "25% Off",
      },
      {
        title: "100 Pax Party — 30% Discount",
        count: 1,
        type: "Voucher",
        detail: "Major 30% discount on high-volume celebration catering and event arrangements for 100 pax.",
        badge: "30% Off",
      },
      {
        title: "Kitty Party Vouchers (2 Free Buffets each)",
        count: 5,
        type: "Voucher",
        detail: "Organize kitty parties or intimate social club gatherings and receive 2 complimentary buffet admissions each time.",
        badge: "10 Free Buffets",
      },
      {
        title: "Banquet 100 Pax — 2 Free Rooms",
        count: 1,
        type: "Voucher",
        detail: "Host a 100-guest celebration in our AC hall or lawns and receive 2 complimentary stay rooms for VIP hosts.",
        badge: "2 Rooms Included",
      },
      {
        title: "Banquet 200 Pax — 4 Free Rooms",
        count: 1,
        type: "Voucher",
        detail: "Host a 200-guest celebration and receive 4 complimentary stay rooms for your family and dignitaries.",
        badge: "4 Rooms Included",
      },
      {
        title: "Banquet 500 Pax — 6 Free Rooms",
        count: 1,
        type: "Voucher",
        detail: "Host a 500-guest gala event and unlock 6 complimentary premium stay rooms for seamless hosting.",
        badge: "6 Rooms Included",
      },
    ],
    redemptionTerms: [
      "Golden Hills Resort maintains a strict zero hall-rental policy; vouchers apply directly to food packages and rooms.",
      "Valid for indoor AC conference halls, Camelot banquet lawn, and poolside event stages.",
      "Advance booking recommended at least 15 days in advance of the event date.",
    ],
  },
  {
    id: "beverages",
    name: "Crazy Beverage Offers",
    shortName: "Beverages",
    tagline: "56 Exclusive Coupons",
    lead: "Generous pour-and-sip privileges with 40% flat discounts and 1+1 / 2+2 offers across mocktails, beers, and spirits.",
    sceneId: "evening-bar-wide-p09",
    vouchersCount: 0,
    couponsCount: 56,
    totalBenefits: 56,
    iconName: "WineGlass",
    colorAccent: "#843d3d",
    highlights: [
      "8 Coupons: 40% Flat Discount on all Beverages",
      "12 Coupons: Pay 1 Mocktail, Get 1 Free (1 + 1)",
      "12 Coupons: 30ML | 60ML Spirits 1 + 1 Free",
      "12 Coupons: Chilled Beer 2 + 2 Free",
      "12 Coupons: Imported Beverages 1 + 1 Free",
    ],
    privileges: [
      {
        title: "Avail 40% Discount on All Beverages",
        count: 8,
        type: "Coupon",
        detail: "Enjoy an outright 40% deduction on your entire beverage round bill at the Sunset Lounge Bar or Pool Deck.",
        badge: "40% Flat Off",
      },
      {
        title: "Mocktail Offer: Pay 1, Get 1 Free",
        count: 12,
        type: "Coupon",
        detail: "Buy any signature resort mocktail or fruit cooler and get another mocktail complimentary.",
        badge: "1 + 1 Mocktails",
      },
      {
        title: "30ML | 60ML Spirits — 1 + 1 Free",
        count: 12,
        type: "Coupon",
        detail: "Buy a 30ml or 60ml pour of your preferred spirits brand and receive a matching pour on the house.",
        badge: "1 + 1 Spirits",
      },
      {
        title: "Beer Pours — 2 + 2 Free",
        count: 12,
        type: "Coupon",
        detail: "Order 2 chilled beers and receive 2 additional beers completely free. Ideal for poolside sundowners.",
        badge: "2 + 2 Beers",
      },
      {
        title: "Imported Beverages — 1 + 1 Free",
        count: 12,
        type: "Coupon",
        detail: "Buy one imported single malt, wine, or premium liqueur and receive a second pour complimentary.",
        badge: "1 + 1 Imported",
      },
    ],
    redemptionTerms: [
      "Alcoholic beverages served strictly in accordance with local licensing regulations to guests of legal drinking age.",
      "Redeemable at Sunset Lounge Bar, Pool Deck Cabana, and during evening poolside hours.",
      "Coupons can be redeemed individually or combined with fellow club member guests.",
    ],
  },
  {
    id: "spa-wellness",
    name: "Spa & Holistic Wellness",
    shortName: "Spa & Wellness",
    tagline: "2 Vouchers + 4 Coupons (6 Privileges)",
    lead: "Rebalance body and mind with Buy-One-Get-One spa packages and 20% savings on authentic Ayurvedic therapies.",
    sceneId: "cottage-pool-terrace-p34",
    vouchersCount: 2,
    couponsCount: 4,
    totalBenefits: 6,
    iconName: "SpaLotus",
    colorAccent: "#387060",
    highlights: [
      "2 Vouchers: Buy 1 Spa Package, Avail 2nd Package Free (1+1)",
      "4 Coupons: Avail 20% Discount on All Ayurvedic Therapies",
    ],
    privileges: [
      {
        title: "Buy 1 Spa Package, Avail 2nd Free (1 + 1)",
        count: 2,
        type: "Voucher",
        detail: "Book any rejuvenating head-to-toe Ayurvedic spa package and bring a companion along at zero additional fee.",
        badge: "1 + 1 BOGO Spa",
      },
      {
        title: "20% Discount on All Therapies",
        count: 4,
        type: "Coupon",
        detail: "Enjoy 20% off on all specialized herbal steam baths, Swedish massages, and deep tissue stress-relief treatments.",
        badge: "20% Savings",
      },
    ],
    redemptionTerms: [
      "Advance appointment required to ensure dedicated therapist availability.",
      "Operates daily from 08:00 AM to 08:00 PM inside the Timber Wellness Enclave.",
      "Complimentary consultation with resort wellness expert included with each therapy.",
    ],
  },
];

/* The keepsake box, as objects rather than one long line of product names.
 * Every word here comes from welcomeKitItems below, split into the thing and
 * its qualifier so the page can show an icon and a short name. */
export type KitItem = {
  icon: "tote" | "flask" | "mug" | "pouch" | "card";
  name: string;
  detail: string;
};

export const welcomeKit: KitItem[] = [
  { icon: "tote", name: "Jute resort tote", detail: "Handcrafted, eco-friendly" },
  { icon: "flask", name: "Monogrammed flask", detail: "Digital temperature readout" },
  { icon: "mug", name: "Ceramic coffee mug", detail: "Matte black, heritage" },
  { icon: "pouch", name: "Travel organiser pouch", detail: "Water-resistant" },
  { icon: "card", name: "Membership card", detail: "Gold metallic, QR key" },
];

export const membershipStats = {
  totalPrivileges: 180,
  totalVouchers: 55,
  totalCoupons: 125,
  categoriesCount: 7,
  validityMonths: 12,
  welcomeKitItems: [
    "Handcrafted Eco-Friendly Jute Resort Tote",
    "Smart Digital LED Temperature Flask with GHR Monogram",
    "Ceramic Matte Black Heritage Resort Coffee Mug",
    "Water-Resistant Premium Travel & Toiletries Organizer Pouch",
    "Personalized Gold Metallic Loyalty Membership Card with QR Key",
  ],
};

export const membershipFaqs = [
  {
    q: "How many total privileges are included with the Golden Hills Membership?",
    a: "The club membership includes exactly 180 verified privileges: 55 High-Value Vouchers and 125 Savings Coupons spanning Room Stays, Day Outings, Gourmet Dining, Banquets, Lounge Beverages, and Spa Therapies.",
  },
  {
    q: "Can I transfer my vouchers to family members or colleagues?",
    a: "Yes! All vouchers and coupons are fully transferable. You can gift room nights, day outing passes, or dining vouchers to family, friends, or corporate associates by presenting the digital voucher code.",
  },
  {
    q: "How do I redeem my vouchers at the resort?",
    a: "Redemption is completely digital and frictionless. Simply quote your Member ID or present your digital voucher card at the reception, restaurant host counter, or spa desk upon arrival.",
  },
  {
    q: "What is the validity period of the membership?",
    a: "All 180 vouchers and coupons remain active for a full 12 months (365 days) from the date of membership activation.",
  },
  {
    q: "Are there any blackout dates for booking complimentary rooms?",
    a: "Room vouchers are valid Sunday through Friday with standard advance booking. Weekends and general dates are widely available, with exclusions limited only to peak national holiday eves (subject to club availability).",
  },
];

