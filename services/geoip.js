// In-memory cache so repeated hops / repeated traces of the same IP
// don't hit the geolocation API every single time.
const cache = new Map();

const EMPTY_RESULT = {
  lat: null,
  lng: null,
  city: null,
  country: null,
  isp: null,
  asn: null,
};

/**
 * Look up approximate geolocation + network info for a single IP address.
 * Uses ip-api.com's free tier (no API key needed, ~45 requests/minute).
 * For production use, consider swapping this for a paid provider or a
 * local MaxMind GeoLite2 database to avoid rate limits.
 */
async function lookupIp(ip) {
  if (cache.has(ip)) return cache.get(ip);

  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country,isp,as`
    );
    const data = await response.json();

    const result =
      data.status === 'success'
        ? {
            lat: data.lat,
            lng: data.lon,
            city: data.city,
            country: data.country,
            isp: data.isp,
            asn: data.as,
          }
        : EMPTY_RESULT;

    cache.set(ip, result);
    return result;
  } catch (err) {
    console.error(`GeoIP lookup failed for ${ip}:`, err.message);
    return EMPTY_RESULT;
  }
}

module.exports = { lookupIp };
