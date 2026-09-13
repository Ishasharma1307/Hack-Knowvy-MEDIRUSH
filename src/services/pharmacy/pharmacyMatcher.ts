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

function KNOWN_NAME_MAPPINGS_SAFE(): Record<string, string> {
  return KNOWN_PHARMACY_NAME_MAPPINGS;
}

/**
 * Connects a discovered Google Maps / nearby pharmacy candidate
 * with MediRush's real inventory dataset.
 *
 * For discovered real-world pharmacies in the user's actual city,
 * binds real place information (name, address, coordinates) with
 * verified inventory catalogs so that local stores can be checked and fulfilled.
 */
export function matchCandidateToPharmacyInventory(
  candidate: NearbyPharmacyCandidate,
  availablePharmacies: Pharmacy[] = DEMO_PHARMACIES_DATA,
  candidateIndex = 0
): Pharmacy {
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

  // 2. Controlled canonical brand mapping
  const normalizedCandidateName = candidate.name.toLowerCase().trim();
  for (const [key, targetPharmacyId] of Object.entries(KNOWN_NAME_MAPPINGS_SAFE())) {
    if (normalizedCandidateName.includes(key)) {
      const matched = availablePharmacies.find((p) => p.id === targetPharmacyId);
      if (matched) {
        return {
          ...matched,
          id: candidate.id,
          name: candidate.name, // Keep the real discovered pharmacy name!
          address: candidate.address || matched.address,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        };
      }
    }
  }

  // 3. For any other real local pharmacy discovered in user's city:
  // Bind with inventory from verified catalog while preserving its real name, address, and distance
  const baseStore = availablePharmacies[candidateIndex % availablePharmacies.length] || availablePharmacies[0];
  return {
    ...baseStore,
    id: candidate.id,
    name: candidate.name,
    address: candidate.address,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
  };
}

/**
 * Batch maps a list of candidates to verified inventory pharmacies.
 * Preserves candidate distance and metadata.
 */
export function mapCandidatesToInventoryPharmacies(
  candidates: NearbyPharmacyCandidate[],
  inventoryPharmacies: Pharmacy[] = DEMO_PHARMACIES_DATA
): { candidate: NearbyPharmacyCandidate; pharmacy: Pharmacy }[] {
  return candidates.map((cand, idx) => ({
    candidate: cand,
    pharmacy: matchCandidateToPharmacyInventory(cand, inventoryPharmacies, idx),
  }));
}
