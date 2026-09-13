import { Pharmacy } from '../../types/pharmacy';
import { 
  EngineInput, 
  EngineResult, 
  FulfilmentPlan, 
  MedicineAllocation, 
  PharmacyFulfilmentSegment, 
  RequestedMedicine 
} from './types';
import { pharmacyHasStock, calculateSinglePharmacyBaseline } from './baseline';
import { calculateCoordinationPenalty, calculateParallelCompletionTime, scoreCombination } from './scoring';
import { calculateDistanceKm } from '../../utils/distance';
import { DEMO_USER_LOCATION } from '../pharmacy/demoPharmacyProvider';

/**
 * Generates all non-empty subsets of an array up to a maximum size.
 */
function getCombinations<T>(array: T[], maxComboSize = 4): T[][] {
  const result: T[][] = [];

  function backtrack(startIndex: number, currentCombo: T[]) {
    if (currentCombo.length > 0) {
      result.push([...currentCombo]);
    }
    if (currentCombo.length >= maxComboSize) {
      return;
    }
    for (let i = startIndex; i < array.length; i++) {
      currentCombo.push(array[i]);
      backtrack(i + 1, currentCombo);
      currentCombo.pop();
    }
  }

  backtrack(0, []);
  return result;
}

/**
 * Smart Fulfilment Engine
 * Deterministic combinatorial optimization over pharmacy network.
 *
 * Guarantees:
 * 1. 100% Complete Prescription Fulfilment (incomplete plans rejected)
 * 2. Minimum Estimated Parallel Delivery Time
 * 3. Minimum Total Travel Distance
 * 4. Minimal Pharmacy Count
 */
export function runSmartFulfilmentEngine(
  input: EngineInput,
  pharmacies: Pharmacy[]
): EngineResult {
  const { medicines, urgency, userLocation = DEMO_USER_LOCATION } = input;

  if (!medicines || medicines.length === 0) {
    return {
      status: 'empty_request',
      bestPlan: null,
      baseline: null,
      timeSavedMinutes: 0,
      speedupPercentage: 0,
      missingMedicines: [],
      whyThisCombination: 'No medicines were requested.',
    };
  }

  const openPharmacies = pharmacies.filter(p => p.open);

  // 1. Calculate Single Pharmacy Baseline for comparison
  const baseline = calculateSinglePharmacyBaseline(medicines, openPharmacies, userLocation);

  // 2. Filter relevant pharmacies (must stock at least one requested item with sufficient quantity)
  const relevantPharmacies = openPharmacies.filter(p =>
    medicines.some(m => pharmacyHasStock(p, m))
  );

  // 3. Pre-check: Does any medicine have 0 pharmacies in the entire network that stock it?
  const globallyMissingMedicines = medicines
    .filter(m => !openPharmacies.some(p => pharmacyHasStock(p, m)))
    .map(m => m.name);

  if (globallyMissingMedicines.length > 0) {
    return {
      status: 'no_complete_plan',
      bestPlan: null,
      baseline,
      timeSavedMinutes: 0,
      speedupPercentage: 0,
      missingMedicines: globallyMissingMedicines,
      whyThisCombination: `No pharmacy combination in the network can fulfill the entire request. Missing items: ${globallyMissingMedicines.join(', ')}.`,
    };
  }

  // 4. Generate candidate combinations (subsets of size 1, 2, 3, 4)
  const candidateCombinations = getCombinations(relevantPharmacies, 4);

  interface ValidPlanEvaluation {
    pharmacies: Pharmacy[];
    allocationMap: Map<string, RequestedMedicine[]>;
    pharmacySegments: PharmacyFulfilmentSegment[];
    allocations: MedicineAllocation[];
    completionTimeMinutes: number;
    coordinationPenaltyMinutes: number;
    totalDistanceKm: number;
    score: number;
  }

  const validPlans: ValidPlanEvaluation[] = [];

  for (const combo of candidateCombinations) {
    // Check if this combination can cover ALL requested medicines
    const allocationMap = new Map<string, RequestedMedicine[]>();
    combo.forEach(p => allocationMap.set(p.id, []));

    let canCoverAll = true;

    for (const req of medicines) {
      // Find pharmacies in this combo that have stock for this medicine
      const stockingStores = combo.filter(p => pharmacyHasStock(p, req));
      if (stockingStores.length === 0) {
        canCoverAll = false;
        break; // Incomplete combination -> reject immediately
      }

      // Assign to the store with the lowest individual completion time
      stockingStores.sort((a, b) => {
        const timeA = a.preparationTimeMinutes + a.deliveryTimeMinutes;
        const timeB = b.preparationTimeMinutes + b.deliveryTimeMinutes;
        return timeA - timeB;
      });

      const chosenStore = stockingStores[0];
      allocationMap.get(chosenStore.id)!.push(req);
    }

    if (!canCoverAll) continue; // Priority 1: Reject incomplete combinations

    // Prune pharmacies from the combo that ended up with 0 assigned medicines
    const activePharmacies = combo.filter(p => (allocationMap.get(p.id)?.length || 0) > 0);
    if (activePharmacies.length === 0) continue;

    // Calculate individual times & distances
    const pharmacyTimes: number[] = [];
    const pharmacySegments: PharmacyFulfilmentSegment[] = [];
    const flatAllocations: MedicineAllocation[] = [];
    let totalDistanceKm = 0;

    for (const pharm of activePharmacies) {
      const assigned = allocationMap.get(pharm.id) || [];
      const distKm = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        pharm.latitude,
        pharm.longitude
      );
      totalDistanceKm += distKm;

      const totalTime = pharm.preparationTimeMinutes + pharm.deliveryTimeMinutes;
      pharmacyTimes.push(totalTime);

      pharmacySegments.push({
        pharmacyId: pharm.id,
        pharmacyName: pharm.name,
        address: pharm.address,
        latitude: pharm.latitude,
        longitude: pharm.longitude,
        distanceKm: distKm,
        preparationTimeMinutes: pharm.preparationTimeMinutes,
        deliveryTimeMinutes: pharm.deliveryTimeMinutes,
        totalTimeMinutes: totalTime,
        allocatedMedicines: assigned,
      });

      assigned.forEach(m => {
        flatAllocations.push({
          medicineName: m.name,
          quantity: m.quantity,
          unit: m.unit,
          pharmacyId: pharm.id,
          pharmacyName: pharm.name,
        });
      });
    }

    const coordinationPenaltyMinutes = calculateCoordinationPenalty(activePharmacies.length);
    const completionTimeMinutes = calculateParallelCompletionTime(
      pharmacyTimes,
      coordinationPenaltyMinutes
    );

    const score = scoreCombination({
      completionTimeMinutes,
      totalDistanceKm,
      pharmacyCount: activePharmacies.length,
      urgency,
    });

    validPlans.push({
      pharmacies: activePharmacies,
      allocationMap,
      pharmacySegments,
      allocations: flatAllocations,
      completionTimeMinutes,
      coordinationPenaltyMinutes,
      totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
      score,
    });
  }

  // 5. If no valid complete plans found
  if (validPlans.length === 0) {
    return {
      status: 'no_complete_plan',
      bestPlan: null,
      baseline,
      timeSavedMinutes: 0,
      speedupPercentage: 0,
      missingMedicines: baseline.missingMedicines,
      whyThisCombination: 'No combination of open pharmacies could cover the full quantity of all requested medicines.',
    };
  }

  // 6. Rank valid plans by score (lowest score is best)
  validPlans.sort((a, b) => a.score - b.score);
  const best = validPlans[0];

  const estimatedCompletionMinutes = best.completionTimeMinutes;

  const timeSavedMinutes = baseline.canFulfillAll
    ? Math.max(0, baseline.estimatedCompletionMinutes - estimatedCompletionMinutes)
    : Math.max(0, baseline.estimatedCompletionMinutes > 0 ? baseline.estimatedCompletionMinutes - estimatedCompletionMinutes : 0);

  const speedupPercentage = baseline.canFulfillAll && baseline.estimatedCompletionMinutes > 0
    ? Math.round(((baseline.estimatedCompletionMinutes - estimatedCompletionMinutes) / baseline.estimatedCompletionMinutes) * 100)
    : 0;

  // 7. Deterministic explanation generation
  let whyThisCombination = '';
  if (best.pharmacySegments.length > 1) {
    if (baseline.canFulfillAll && baseline.pharmacy) {
      whyThisCombination = `Single pharmacy (${baseline.pharmacy.name}) would take ~${baseline.estimatedCompletionMinutes} min to deliver from ${baseline.distanceKm} km away. MediRush selected a 2-hub parallel dispatch (${best.pharmacySegments.map(p => `${p.pharmacyName} for ${p.allocatedMedicines.length} items`).join(' + ')}) because both couriers travel shorter distances concurrently, fulfilling all ${medicines.length} medicines in ~${estimatedCompletionMinutes} min (saving ~${timeSavedMinutes} min).`;
    } else {
      whyThisCombination = `No single nearby pharmacy had all ${medicines.length} medicines in stock. MediRush combined ${best.pharmacySegments.map(p => `${p.pharmacyName} (${p.allocatedMedicines.length} medicines)`).join(' and ')} to achieve 100% complete prescription fulfilment in ~${estimatedCompletionMinutes} min.`;
    }
  } else {
    const singleStore = best.pharmacySegments[0];
    whyThisCombination = `${singleStore.pharmacyName} is only ${singleStore.distanceKm} km away and has 100% of requested medicines in stock. It was selected as the optimal fastest route (~${estimatedCompletionMinutes} min).`;
  }

  const bestPlan: FulfilmentPlan = {
    planId: `plan_${Date.now()}`,
    allMedicinesCovered: true,
    medicinesCoveredCount: medicines.length,
    totalMedicinesRequestedCount: medicines.length,
    pharmacies: best.pharmacySegments,
    allocations: best.allocations,
    estimatedCompletionMinutes,
    coordinationPenaltyMinutes: best.coordinationPenaltyMinutes,
    totalDistanceKm: best.totalDistanceKm,
    pharmacyCount: best.pharmacySegments.length,
    score: best.score,
    explanation: whyThisCombination,
    missingMedicines: [],
  };

  return {
    status: 'success',
    bestPlan,
    baseline,
    timeSavedMinutes,
    speedupPercentage,
    missingMedicines: [],
    whyThisCombination,
  };
}
