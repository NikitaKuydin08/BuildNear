// Venue-level location: "13.7563, 100.5018" (as copied from a maps app), or a maps link containing "@lat,lon".
export function parseCoords(input: string): { lat: number; lon: number } | null {
  const t = input.trim();
  if (!t) return null;
  const m = /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/.exec(t) ?? /^(-?\d{1,3}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/.exec(t);
  if (!m) return null;
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
}

// OpenStreetMap embed: no API key, no account. Shows only the venue marker.
export function mapEmbedUrl(lat: number, lon: number) {
  const d = 0.004;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d},${lat - d * 0.7},${lon + d},${lat + d * 0.7}&layer=mapnik&marker=${lat},${lon}`;
}
export const mapOpenUrl = (lat: number, lon: number) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
