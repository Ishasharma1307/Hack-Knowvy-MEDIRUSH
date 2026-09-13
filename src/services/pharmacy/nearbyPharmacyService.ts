import { NearbyPharmacyCandidate, NearbyPharmacyProvider } from '../../types/pharmacy';
import { discoverNearbyPharmaciesWithGemini } from '../gemini/nearbyPharmacyDiscovery';
import { DEMO_PHARMACIES_DATA } from './demoPharmacyProvider';
import { calculateDistanceKm } from '../../utils/distance';

export interface NearbyPharmacyDiscoveryResult {
  candidates: NearbyPharmacyCandidate[];
  providerType: 'google_maps' | 'demo';
  sourceDescription: string;
}

/**
 * Google Maps / Gemini Grounded Provider
 */
export class GoogleMapsPharmacyProvider implements NearbyPharmacyProvider {
  async findNearbyPharmacies(location: { latitude: number; longitude: number }): Promise<NearbyPharmacyCandidate[]> {
    const candidates = await discoverNearbyPharmaciesWithGemini(location);
    return candidates.slice(0, 5);
  }
}

/**
 * Demo Pharmacy Provider
 * Deterministically computes distances from the given user location to our verified
 * pharmacy network and selects the top 5 closest stores.
 */
export class DemoPharmacyCandidateProvider implements NearbyPharmacyProvider {
  async findNearbyPharmacies(location: { latitude: number; longitude: number }): Promise<NearbyPharmacyCandidate[]> {
    const scored = DEMO_PHARMACIES_DATA.map((p) => {
      const distanceKm = calculateDistanceKm(location.latitude, location.longitude, p.latitude, p.longitude);
      return {
        id: p.id,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        address: p.address,
        distanceKm: Math.round(distanceKm * 10) / 10,
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
 * Tries Google Maps / Gemini place discovery first.
 * If unavailable, empty, or fails, falls back gracefully to the DemoPharmacyProvider.
 */
export async function getTopNearbyPharmacies(
  location: { latitude: number; longitude: number },
  limit = 5
): Promise<NearbyPharmacyDiscoveryResult> {
  // 1. Try Google Maps / Gemini Provider
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
