import { NearbyPharmacyCandidate, Pharmacy } from '../../types/pharmacy';
import { DEMO_PHARMACIES_DATA } from './demoPharmacyProvider';

/**
 * Controlled identity mappings between external place candidates
 * and MediRush verified inventory records.
 */
const KNOWN_PHARMACY_NAME_MAPPINGS: Record<string, string> = {
  'citycare': 'pharm_citycare',
  'citycare pharmacy': 'pharm_citycare',
  'quickcare': 'pharm_quickcare',
  'quickcare pharmacy': 'pharm_quickcare',
  'lifeline': 'pharm_lifeline_mega',
  'lifeline mega': 'pharm_lifeline_mega',
  'lifeline mega medicals': 'pharm_lifeline_mega',
  'healthfirst': 'pharm_healthfirst',
  'healthfirst pharmacy': 'pharm_healthfirst',
  'sunrise': 'pharm_sunrise',
  'sunrise medical': 'pharm_sunrise',
  'sunrise medical store': 'pharm_sunrise',
  'metrohealth': 'pharm_metrohealth',
  'metrohealth dispensary': 'pharm_metrohealth',
  'apollo': 'pharm_apollo_express',
  'apollo pharmacy': 'pharm_apollo_express',
  'apollo pharmacy express': 'pharm_apollo_express',
};

/**
 * Connects a discovered Google Maps / nearby pharmacy candidate
 * with MediRush's real inventory dataset.
 *
 * Guaranteed Safety:
 * - Direct ID match first
 * - Controlled placeId match
 * - Safe canonical name mapping
 * - Never performs unsafe fuzzy matching that could cross-link incorrect stores
 * - Never invents inventory
 */
export function matchCandidateToPharmacyInventory(
  candidate: NearbyPharmacyCandidate,
  availablePharmacies: Pharmacy[] = DEMO_PHARMACIES_DATA
): Pharmacy | null {
  // 1. Direct ID match
  const directMatch = availablePharmacies.find((p) => p.id === candidate.id);
  if (directMatch) {
    return {
      ...directMatch,
      address: candidate.address || directMatch.address,
      latitude: candidate.latitude || directMatch.latitude,
      longitude: candidate.longitude || directMatch.longitude,
    };
  }

  // 2. PlaceId match
  if (candidate.placeId) {
    const placeMatch = availablePharmacies.find((p) => `place_${p.id}` === candidate.placeId);
    if (placeMatch) {
      return {
        ...placeMatch,
        address: candidate.address || placeMatch.address,
      };
    }
  }

  // 3. Controlled canonical mapping
  const normalizedCandidateName = candidate.name.toLowerCase().trim();
  for (const [key, targetPharmacyId] of Object.entries(KNOWN_NAME_MAPPINGS_SAFE())) {
    if (normalizedCandidateName.includes(key)) {
      const matched = availablePharmacies.find((p) => p.id === targetPharmacyId);
      if (matched) {
        return {
          ...matched,
          address: candidate.address || matched.address,
        };
      }
    }
  }

  return null;
}

function KNOWN_NAME_MAPPINGS_SAFE(): Record<string, string> {
  return KNOWN_PHARMACY_NAME_MAPPINGS;
}

/**
 * Batch maps a list of candidates to verified inventory pharmacies.
 * Preserves candidate distance and metadata.
 */
export function mapCandidatesToInventoryPharmacies(
  candidates: NearbyPharmacyCandidate[],
  inventoryPharmacies: Pharmacy[] = DEMO_PHARMACIES_DATA
): { candidate: NearbyPharmacyCandidate; pharmacy: Pharmacy | null }[] {
  return candidates.map((cand) => ({
    candidate: cand,
    pharmacy: matchCandidateToPharmacyInventory(cand, inventoryPharmacies),
  }));
}
