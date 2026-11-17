// Smart fields of the "New Gold Member" form (SOW ERP-05; D-131…D-134; docs/04-modules/membership.md).
// Pure helpers: they make typing easier and catch mistakes early. The server repeats every rule
// (access-service MembershipService.validate, IdentityNumbers), so nothing here is trusted on its own.

/** Today's date in the browser's calendar (the resort's tablets/phones run on IST) as YYYY-MM-DD. */
export function localToday(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

const parts = (iso: string) => iso.split("-").map(Number) as [number, number, number];
const leap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Age in whole years on `today` (YYYY-MM-DD), and whether that is 18 or more. Null for an empty/invalid date. */
export function calculateAge(dob: string, today = localToday()): { age: number; isEligible: boolean } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
  const [by, bm, bd] = parts(dob);
  const [ty, tm, td] = parts(today);
  if (dob > today) return null;
  const age = ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
  return { age, isEligible: age >= 18 };
}

/** Earliest date of birth the form accepts (stops typos like year 0200 or 1026). */
export const MIN_DOB = "1900-01-01";

/**
 * Null when the date of birth is fine, else what is wrong. Catches what the age pill alone missed: a half-typed or
 * impossible date (31 Feb), a date in the future, a year before 1900, and under-18s.
 */
export function dobProblem(dob: string, today = localToday()): string | null {
  if (!dob) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return "Enter a complete date of birth.";
  const [y, m, d] = parts(dob);
  const real = new Date(Date.UTC(y, m - 1, d));
  if (real.getUTCFullYear() !== y || real.getUTCMonth() !== m - 1 || real.getUTCDate() !== d) return "That date doesn't exist.";
  if (dob > today) return "Date of birth can't be in the future.";
  if (dob < MIN_DOB) return "Check the year — date of birth must be 1900 or later.";
  const age = calculateAge(dob, today);
  return age && !age.isEligible ? "Customer must be at least 18 years old." : null;
}

/** The latest date of birth that is 18 today: the date input's `max`. 29 Feb → 28 Feb (same as the server). */
export function maxDobFor18(today = localToday()): string {
  const [ty, tm, td] = parts(today);
  const y = ty - 18;
  const d = tm === 2 && td === 29 && !leap(y) ? 28 : td;
  return `${y}-${String(tm).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// --- Aadhaar (UIDAI: 12 digits, first digit 2–9, Verhoeff check digit) -------------------------------------------------

const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]];
const INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/** Verhoeff check: true when the last digit is the right check digit for the others. */
export function validateVerhoeff(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let c = 0;
  for (let i = 0; i < digits.length; i++) c = D[c][P[i % 8][Number(digits[digits.length - 1 - i])]];
  return c === 0;
}

/** The check digit to append (tests use it to build valid numbers). */
export function verhoeffCheckDigit(digits: string): number {
  let c = 0;
  for (let i = 0; i < digits.length; i++) c = D[c][P[(i + 1) % 8][Number(digits[digits.length - 1 - i])]];
  return INV[c];
}

export const aadhaarDigits = (raw: string) => raw.replace(/\D/g, "").slice(0, 12);

/** "234567890123" or "2345-6789 0123" → "2345 6789 0123" (as printed on the card); at most 12 digits. */
export function formatAadhaar(raw: string): string {
  return aadhaarDigits(raw).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Null when valid, else what is wrong (same wording as the server). */
export function aadhaarProblem(raw: string): string | null {
  const d = aadhaarDigits(raw);
  if (d.length !== 12) return "Aadhaar has 12 digits.";
  if (!/^[2-9]/.test(d)) return "An Aadhaar number can't start with 0 or 1.";
  if (!validateVerhoeff(d)) return "This Aadhaar number has a typo (the check digit doesn't match). Check it on the card.";
  return null;
}

/** What is stored and shown to managers: XXXX-XXXX-0123. */
export const maskAadhaar = (raw: string) => "XXXX-XXXX-" + aadhaarDigits(raw).slice(-4);

// --- Driving licence ----------------------------------------------------------------------------------------------------

export const licenceNormalised = (raw: string) => raw.toUpperCase().replace(/[\s/-]/g, "");

/** State code + RTO number + the rest, e.g. KA01 20190001234 (older licences vary in length; Q-038). */
export function licenceProblem(raw: string): string | null {
  return /^[A-Z]{2}\d{2}[0-9A-Z]{9,13}$/.test(licenceNormalised(raw)) ? null
    : "Enter the licence number as printed, e.g. KA01 20190001234 (state code, RTO number, then the rest).";
}

export const maskLicence = (raw: string) => {
  const n = licenceNormalised(raw);
  return "X".repeat(Math.max(0, n.length - 4)) + n.slice(-4);
};

// --- PAN (employees, D-139) ---------------------------------------------------------------------------------------------

/** Upper case, letters and digits only, at most 10 characters ("abcpe 1234-f" → "ABCPE1234F"). */
export const panNormalised = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);

/** 5 letters, 4 digits, 1 letter; the 4th letter is P for a person. Same messages as the server. */
export function panProblem(raw: string): string | null {
  const p = panNormalised(raw);
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(p)) return "PAN has 10 characters: 5 letters, 4 digits, 1 letter (e.g. ABCPE1234F).";
  return p[3] === "P" ? null : "The 4th letter of a person's PAN is P. Check it on the card.";
}

export const maskPan = (raw: string) => "XXXXXX" + panNormalised(raw).slice(-4);

// --- Mobile (+91) -------------------------------------------------------------------------------------------------------

/**
 * The 10 local digits from what was typed or pasted: "+91 98765 43210", "919876543210" and "09876543210" all give
 * "9876543210". The +91 is shown as a fixed prefix next to the field.
 */
export function cleanMobile(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 11);   // keeps a leading 0 while it is being typed; the 11th digit strips it
}

export const isValidMobile = (digits: string) => /^[6-9]\d{9}$/.test(digits);

// --- Text ---------------------------------------------------------------------------------------------------------------

/** "anoop kumar" → "Anoop Kumar", "ANOOP" → "Anoop"; a word in mixed case (McDonald, D'Souza) is kept. */
export function toTitleCase(s: string): string {
  return s.trim().split(/\s+/).filter(Boolean).map((w) =>
    w === w.toLowerCase() || w === w.toUpperCase() ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(" ");
}

// --- Address ------------------------------------------------------------------------------------------------------------

/** The 28 states and 8 union territories (same list as access-service IndianStates). */
export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

export const isValidPincode = (p: string) => /^[1-9]\d{5}$/.test(p);

/** pincode → [city, state], built from India Post's All India Pincode Directory (web/scripts/build-pincodes.mjs). */
type PincodeTable = Record<string, [string, string]>;
let table: PincodeTable | null | undefined;

// The data file exists only once it has been built from the India Post CSV (D-133). import.meta.glob gives {} when
// it is missing, so the form simply falls back to typing the city.
const pincodeFiles = import.meta.glob<{ default: PincodeTable }>("./data/pincodes.json");

async function pincodeTable(): Promise<PincodeTable | null> {
  if (table !== undefined) return table;
  const load = pincodeFiles["./data/pincodes.json"];
  try {
    table = load ? (await load()).default : null;
  } catch {
    table = null;
  }
  return table;
}

/** For tests: use this table instead of the built file. */
export function setPincodeTableForTests(t: PincodeTable | null) {
  table = t;
}

/** City and state for a 6-digit pincode, or null when unknown (or no data file yet). */
export async function lookupPincode(pincode: string): Promise<{ city: string; state: string } | null> {
  if (!isValidPincode(pincode)) return null;
  const hit = (await pincodeTable())?.[pincode];
  return hit ? { city: hit[0], state: hit[1] } : null;
}

// --- Money ----------------------------------------------------------------------------------------------------------------

/** 25000 → "₹25,000" (Indian grouping). */
export const rupees = (n: number) => "₹" + n.toLocaleString("en-IN");

/** "25000, 30000,50000" → [25000, 30000, 50000]; anything that isn't a positive whole number is dropped. */
export function parseFeeChips(raw: string | undefined): number[] {
  return (raw ?? "").split(",").map((s) => s.trim()).filter((s) => /^[1-9]\d{0,9}$/.test(s)).map(Number);
}
