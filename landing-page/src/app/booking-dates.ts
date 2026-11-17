/**
 * Shared date logic for Golden Hills Resort booking components.
 * Formats and operates on local calendar dates (YYYY-MM-DD), ensuring
 * visitors in IST and local time zones always receive correct day boundaries.
 */

/**
 * Returns a YYYY-MM-DD string for a given Date in local time.
 */
export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD.
 */
export function getTodayStr(): string {
  return toISODate(new Date());
}

/**
 * Checks if a string is a valid YYYY-MM-DD calendar date.
 */
export function isValidDateStr(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return false;
  const testDate = new Date(y, m - 1, d);
  return (
    testDate.getFullYear() === y &&
    testDate.getMonth() === m - 1 &&
    testDate.getDate() === d
  );
}

/**
 * Adds N days to a YYYY-MM-DD date string.
 * If dateStr is invalid or empty, adds N days relative to today.
 */
export function addDays(dateStr: string, days: number): string {
  if (!isValidDateStr(dateStr)) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return toISODate(d);
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

/**
 * Computes whole nights between check-in and check-out.
 * Returns 0 if either date is invalid or if check-out <= check-in.
 */
export function getNightsBetween(from: string, to: string): number {
  if (!isValidDateStr(from) || !isValidDateStr(to)) return 0;
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  const t1 = new Date(y1, m1 - 1, d1).getTime();
  const t2 = new Date(y2, m2 - 1, d2).getTime();
  const diff = Math.round((t2 - t1) / 86400000);
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
}

/**
 * Ensures checkout is strictly after checkin, and checkin is >= today.
 * Returns validated [validCheckin, validCheckout].
 */
export function sanitizeBookingDates(
  rawCheckin: string,
  rawCheckout: string,
  minStayNights: number = 1
): [string, string] {
  const today = getTodayStr();
  let checkin = isValidDateStr(rawCheckin) && rawCheckin >= today
    ? rawCheckin
    : addDays(today, 1);

  const minCheckout = addDays(checkin, minStayNights);
  let checkout = isValidDateStr(rawCheckout) && rawCheckout >= minCheckout
    ? rawCheckout
    : addDays(checkin, Math.max(minStayNights, 2));

  return [checkin, checkout];
}

