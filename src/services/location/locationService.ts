import { DEMO_USER_LOCATION } from '../pharmacy/demoPharmacyProvider';

export interface UserLocationResult {
  latitude: number;
  longitude: number;
  address: string;
  isFallback: boolean;
  permissionState: 'granted' | 'denied' | 'fallback';
}

const CACHED_LOCATION_KEY = 'medirush_user_real_location';

/**
 * Reverse geocodes coordinates to a human-readable city and neighborhood.
 * Uses OpenStreetMap Nominatim with a short safety timeout.
 */
export async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
      {
        headers: { 'User-Agent': 'MediRush/1.0' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const neighbourhood = addr.suburb || addr.neighbourhood || addr.residential || addr.road || '';
      const city = addr.city || addr.town || addr.county || addr.state_district || addr.state || '';

      if (neighbourhood && city) {
        return `${neighbourhood}, ${city}`;
      }
      if (data.display_name) {
        const parts = data.display_name.split(',').map((p: string) => p.trim());
        return parts.slice(0, 3).join(', ');
      }
    }
  } catch (_e) {
    // Network or timeout fallback
  }

  return `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

/**
 * Location Service for MediRush
 * Actively requests real browser geolocation via GPS/Wi-Fi (`navigator.geolocation.getCurrentPosition`),
 * reverse-geocodes to the user's actual city and neighborhood, and caches it.
 *
 * Guarantees the application is NEVER blocked if permission is denied.
 */
export async function getUserLocation(timeoutMs = 7000): Promise<UserLocationResult> {
  // Check cached location first for instant response
  try {
    const cached = sessionStorage.getItem(CACHED_LOCATION_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.latitude && parsed.longitude) {
        return parsed;
      }
    }
  } catch (_e) {}

  // Check if browser geolocation is supported
  if (typeof window === 'undefined' || !navigator || !navigator.geolocation) {
    return {
      latitude: DEMO_USER_LOCATION.latitude,
      longitude: DEMO_USER_LOCATION.longitude,
      address: DEMO_USER_LOCATION.address,
      isFallback: true,
      permissionState: 'fallback',
    };
  }

  return new Promise((resolve) => {
    let resolved = false;

    // Safety timeout fallback
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          latitude: DEMO_USER_LOCATION.latitude,
          longitude: DEMO_USER_LOCATION.longitude,
          address: `${DEMO_USER_LOCATION.address} (Demo Fallback)`,
          isFallback: true,
          permissionState: 'fallback',
        });
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Perform reverse geocoding to get real city and area
        const readableAddress = await reverseGeocodeCoordinates(lat, lng);

        const result: UserLocationResult = {
          latitude: lat,
          longitude: lng,
          address: readableAddress,
          isFallback: false,
          permissionState: 'granted',
        };

        try {
          sessionStorage.setItem(CACHED_LOCATION_KEY, JSON.stringify(result));
        } catch (_e) {}

        resolve(result);
      },
      (_err) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        // Fallback on permission denied, timeout, or location disabled
        resolve({
          latitude: DEMO_USER_LOCATION.latitude,
          longitude: DEMO_USER_LOCATION.longitude,
          address: DEMO_USER_LOCATION.address,
          isFallback: true,
          permissionState: 'denied',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs - 1000,
        maximumAge: 30000, // cache for 30s
      }
    );
  });
}
