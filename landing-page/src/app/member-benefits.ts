/* Gold Member amenities shown on /profile (D-123).
 *
 * NOT confirmed by the client: these come from the draft membership plan, not
 * from a client document (OPEN_QUESTIONS Q-032). Every item is shown with
 * "to be confirmed" until the resort approves the list and the discounts.
 * Change this file only; nothing else hard-codes a benefit. */

export type MemberBenefit = { title: string; detail: string; confirmed: boolean };

export const memberBenefits: MemberBenefit[] = [
  { title: "Swimming pools", detail: "Main pool and children's splash pool", confirmed: false },
  { title: "Fitness centre", detail: "Cardio zone and gym", confirmed: false },
  { title: "Indoor games lounge", detail: "Billiards, table tennis and board games", confirmed: false },
  { title: "Evening campfire", detail: "Campfire gatherings and nature trails", confirmed: false },
  { title: "Spa privilege", detail: "20% off spa therapies", confirmed: false },
  { title: "Dining privilege", detail: "15% off at resort restaurants", confirmed: false },
];

/** The resort desk, used when the enrolling executive does not share a number (as on /login). */
export const RESORT_DESK = { display: "+91 8353 200 100", tel: "+918353200100" };
