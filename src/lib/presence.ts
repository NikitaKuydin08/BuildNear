// Time rules in one place.
export const LOCATION_TTL_MS = 4 * 60 * 60 * 1000; // shared position expires after 4 h without a refresh
export const HERE_GRACE_MS = 60 * 60 * 1000; // stays "here now" 1 h after the event ends
export const NEARBY_KM = 5;

// "Here now" follows the event itself: checked in, and the event has not ended (plus a grace hour).
// A 12 h day or a 24 h+ hackathon works the same, with no fixed timer.
// Tapping "I left" ends it early; checking in again (a later time) turns it back on.
export const isHere = (checkedInAt: Date | null, leftAt: Date | null, eventEndsAt: Date) =>
  !!checkedInAt &&
  !(leftAt && leftAt.getTime() >= checkedInAt.getTime()) &&
  Date.now() < eventEndsAt.getTime() + HERE_GRACE_MS;
export const isFresh = (at: Date | null) => !!at && Date.now() - at.getTime() < LOCATION_TTL_MS;

// Rounding to 2 decimals is about 1.1 km: coarse on purpose.
export const roundCoord = (v: number) => Math.round(v * 100) / 100;

export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Never show coordinates, only a band.
export function distanceLabel(km: number) {
  if (km < 1.6) return "Same area";
  if (km < 10) return `About ${Math.round(km)} km away`;
  return "Further away";
}

// True once the event (plus an optional grace period) is over. A helper so pages don't read the clock while rendering.
export const hasEnded = (endsAt: Date, graceMs = 0) => Date.now() > endsAt.getTime() + graceMs;
