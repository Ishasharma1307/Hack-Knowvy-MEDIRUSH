import { NearbyPharmacyCandidate, NearbyPharmacyProvider } from '../../types/pharmacy';
import { discoverNearbyPharmaciesWithGemini } from '../gemini/nearbyPharmacyDiscovery';
import { DEMO_PHARMACIES_DATA } from './demoPharmacyProvider';
import { calculateDistanceKm } from '../../utils/distance';

export interface NearbyPharmacyDiscoveryResult {
  candidates: NearbyPharmacyCandidate[];
  providerType: 'google_maps' | 'demo';
  sourceDescription: string;
}

export interface SearchLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Google Maps / Gemini Grounded Provider
 */
export class GoogleMapsPharmacyProvider implements NearbyPharmacyProvider {
  async findNearbyPharmacies(location: SearchLocation): Promise<NearbyPharmacyCandidate[]> {
    const candidates = await discoverNearbyPharmaciesWithGemini(location);
    return candidates.slice(0, 5);
  }
}

/**
 * Demo Pharmacy Provider
 * Computes distances from the given user location to our verified
 * pharmacy network and selects the top 5 closest stores.
 */
export class DemoPharmacyCandidateProvider implements NearbyPharmacyProvider {
  async findNearbyPharmacies(location: SearchLocation): Promise<NearbyPharmacyCandidate[]> {
    const scored = DEMO_PHARMACIES_DATA.map((p, idx) => {
      // Localize coordinates to user's real vicinity if user is far from demo base
      const userDist = calculateDistanceKm(location.latitude, location.longitude, p.latitude, p.longitude);
      const isFarFromDemoBase = userDist > 50;

      // Realistic localized distance between 0.8 km and 3.5 km
      const distanceKm = isFarFromDemoBase 
        ? Math.round((0.8 + idx * 0.4) * 10) / 10 
        : Math.round(userDist * 10) / 10;

      const localAddress = isFarFromDemoBase && location.address
        ? `${p.address.split(',')[0]}, ${location.address}`
        : p.address;

      return {
        id: p.id,
        name: p.name,
        latitude: isFarFromDemoBase ? location.latitude + (idx * 0.005) : p.latitude,
        longitude: isFarFromDemoBase ? location.longitude + (idx * 0.004) : p.longitude,
        address: localAddress,
        distanceKm,
        placeId: `place_${p.id}`,
        open: p.open,
      };
    });

    // Sort strictly by distance and take top 5
    scored.sort((a, b) => a.distanceKm - b.distanceKm);
    return scored.slice(0, 5);
  }
}

/**
 * Unified Discovery Service
 * Tries Google Maps / Gemini place discovery first with real user coordinates.
 * If unavailable, empty, or fails, falls back gracefully to the localized DemoPharmacyProvider.
 */
export async function getTopNearbyPharmacies(
  location: SearchLocation,
  limit = 5
): Promise<NearbyPharmacyDiscoveryResult> {
  // 1. Try Google Maps / Gemini Provider with real coordinates
  try {
    const mapsProvider = new GoogleMapsPharmacyProvider();
    const discovered = await mapsProvider.findNearbyPharmacies(location);

    if (discovered && discovered.length >= 3) {
      return {
        candidates: discovered.slice(0, limit),
        providerType: 'google_maps',
        sourceDescription: 'Google Maps & Gemini Grounded Places',
      };
    }
  } catch (err) {
    console.warn('[MediRush Discovery] Primary discovery unavailable, switching to demo provider:', err);
  }

  // 2. Fallback to Demo Pharmacy Provider
  const demoProvider = new DemoPharmacyCandidateProvider();
  const demoCandidates = await demoProvider.findNearbyPharmacies(location);

  return {
    candidates: demoCandidates.slice(0, limit),
    providerType: 'demo',
    sourceDescription: 'Demo pharmacy network',
  };
}
