import { Pharmacy } from '../../types/pharmacy';
import { RequestedMedicine, SinglePharmacyBaseline } from './types';
import { areMedicineNamesMatching } from '../../utils/medicineNormalization';
import { calculateDistanceKm } from '../../utils/distance';
import { DEMO_USER_LOCATION } from '../pharmacy/demoPharmacyProvider';

/**
 * Checks if a pharmacy has enough stock for a requested medicine.
 */
export function pharmacyHasStock(pharmacy: Pharmacy, reqMed: RequestedMedicine): boolean {
  if (!pharmacy.open) return false;
  return pharmacy.inventory.some(
    inv =>
      areMedicineNamesMatching(reqMed.name, inv.medicineName) &&
      inv.availableQuantity >= reqMed.quantity
  );
}

/**
 * Evaluates the baseline "Single Pharmacy Approach".
 * Scans all open pharmacies to find:
 * 1. The fastest single pharmacy that can fulfill ALL requested medicines (if one exists).
 * 2. Or, if none can fulfill all, the pharmacy with the MAXIMUM coverage.
 */
export function calculateSinglePharmacyBaseline(
  requestedMedicines: RequestedMedicine[],
  pharmacies: Pharmacy[],
  userLocation = DEMO_USER_LOCATION
): SinglePharmacyBaseline {
  const openPharmacies = pharmacies.filter(p => p.open);

  interface SingleCandidate {
    pharmacy: Pharmacy;
    covered: RequestedMedicine[];
    missing: string[];
    canFulfillAll: boolean;
    distanceKm: number;
    completionMinutes: number;
  }

  const candidates: SingleCandidate[] = [];

  for (const pharm of openPharmacies) {
    const covered: RequestedMedicine[] = [];
    const missing: string[] = [];

    for (const req of requestedMedicines) {
      if (pharmacyHasStock(pharm, req)) {
        covered.push(req);
      } else {
        missing.push(req.name);
      }
    }

    const canFulfillAll = covered.length === requestedMedicines.length;
    const distanceKm = calculateDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      pharm.latitude,
      pharm.longitude
    );


    const completionMinutes = pharm.preparationTimeMinutes + pharm.deliveryTimeMinutes;

    candidates.push({
      pharmacy: pharm,
      covered,
      missing,
      canFulfillAll,
      distanceKm,
      completionMinutes,
    });
  }

  // 1. Look for single pharmacies that cover 100% of medicines
  const completeCandidates = candidates.filter(c => c.canFulfillAll);

  if (completeCandidates.length > 0) {
    // Sort complete single stores by lowest completion time
    completeCandidates.sort((a, b) => a.completionMinutes - b.completionMinutes);
    const best = completeCandidates[0];

    return {
      pharmacy: best.pharmacy,
      canFulfillAll: true,
      medicinesCoveredCount: best.covered.length,
      totalMedicinesRequestedCount: requestedMedicines.length,
      coveredMedicines: best.covered,
      missingMedicines: [],
      estimatedCompletionMinutes: best.completionMinutes,
      timeSavedMinutes: 0,
      distanceKm: best.distanceKm,
    };
  }

  // 2. If no single pharmacy can fulfill 100%, pick the one covering the most medicines
  candidates.sort((a, b) => {
    if (b.covered.length !== a.covered.length) {
      return b.covered.length - a.covered.length; // highest coverage first
    }
    return a.completionMinutes - b.completionMinutes; // faster first
  });

  const bestPartial = candidates[0] || null;

  return {
    pharmacy: bestPartial ? bestPartial.pharmacy : null,
    canFulfillAll: false,
    medicinesCoveredCount: bestPartial ? bestPartial.covered.length : 0,
    totalMedicinesRequestedCount: requestedMedicines.length,
    coveredMedicines: bestPartial ? bestPartial.covered : [],
    missingMedicines: bestPartial ? bestPartial.missing : requestedMedicines.map(m => m.name),
    estimatedCompletionMinutes: bestPartial ? bestPartial.completionMinutes : 0,
    timeSavedMinutes: 0,
    distanceKm: bestPartial ? bestPartial.distanceKm : 0,
  };
}
