import { DemoLocation } from '../../types/pharmacy';
import { DEMO_USER_LOCATION } from '../pharmacy/demoPharmacyProvider';

export interface UserLocationResult {
  latitude: number;
  longitude: number;
  address: string;
  isFallback: boolean;
  permissionState: 'granted' | 'denied' | 'fallback';
}

/**
 * Location Service for MediRush
 * Requests browser geolocation when user permits, with instant fallback
 * to hackathon demo location (Connaught Place / Bengaluru hub) if denied or unavailable.
 * Guarantees the application is NEVER blocked by location errors.
 */
export async function getUserLocation(timeoutMs = 6000): Promise<UserLocationResult> {
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

    // Safety timeout to avoid hanging indefinitely
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          latitude: DEMO_USER_LOCATION.latitude,
          longitude: DEMO_USER_LOCATION.longitude,
          address: `${DEMO_USER_LOCATION.address} (Demo Location)`,
          isFallback: true,
          permissionState: 'fallback',
        });
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        resolve({
          latitude: lat,
          longitude: lng,
          address: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          isFallback: false,
          permissionState: 'granted',
        });
      },
      (_err) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        // Graceful fallback on permission denied, timeout, or unavailable
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
        maximumAge: 60000, // cache for 1 minute
      }
    );
  });
}
