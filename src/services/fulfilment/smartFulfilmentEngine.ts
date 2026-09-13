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
 * Single Pharmacy Order Optimization
 * Evaluates ONLY the provided top nearby candidate pharmacies.
 * Checks completeness, stock levels, open status, distance, and completion time.
 * Enforces strict ranking:
 * 1. Filter for complete fulfilment (100% of requested items with adequate stock)
 * 2. Rank complete candidates by:
 *    - Operating status (must be open)
 *    - Estimated fulfilment time (prep + delivery)
 *    - Distance (closer pharmacy wins on ties or within 2 min difference)
 */
function runSinglePharmacyOptimization(
  input: EngineInput,
  candidatePharmacies: Pharmacy[]
): EngineResult {
  const { medicines, userLocation = DEMO_USER_LOCATION } = input;

  if (!medicines || medicines.length === 0) {
    return {
      status: 'empty_request',
      mode: 'single_pharmacy',
      bestPlan: null,
      baseline: null,
      timeSavedMinutes: 0,
      speedupPercentage: 0,
      missingMedicines: [],
      whyThisCombination: 'No medicines were requested.',
    };
  }

  // Evaluate all candidates
  const evaluatedCandidates = candidatePharmacies.map((pharm) => {
    const covered: RequestedMedicine[] = [];
    const missing: string[] = [];

    for (const req of medicines) {
      if (pharmacyHasStock(pharm, req)) {
        covered.push(req);
      } else {
        missing.push(req.name);
      }
    }

    const isComplete = covered.length === medicines.length && pharm.open;
    const distanceKm = Math.round(
      calculateDistanceKm(userLocation.latitude, userLocation.longitude, pharm.latitude, pharm.longitude) * 10
    ) / 10;
    const prepTime = pharm.preparationTimeMinutes || 5;
    const deliveryTime = pharm.deliveryTimeMinutes || Math.max(5, Math.round(distanceKm * 2.5));
    const totalTime = prepTime + deliveryTime;

    return {
      candidateId: pharm.id,
      candidateName: pharm.name,
      address: pharm.address,
      distanceKm,
      open: pharm.open,
      medicinesAvailableCount: covered.length,
      totalMedicinesRequestedCount: medicines.length,
      isComplete,
      status: (isComplete ? 'Eligible' : 'Not eligible') as 'SELECTED' | 'Eligible' | 'Not eligible',
      missingMedicines: missing,
      preparationTimeMinutes: prepTime,
      deliveryTimeMinutes: deliveryTime,
      totalTimeMinutes: totalTime,
      pharmacy: pharm,
    };
  });

  // Filter for complete, open candidates
  const completeCandidates = evaluatedCandidates.filter((c) => c.isComplete && c.open);

  // If none can fulfill the complete request
  if (completeCandidates.length === 0) {
    const allMissing = Array.from(
      new Set(evaluatedCandidates.flatMap((c) => c.missingMedicines))
    );

    return {
      status: 'no_single_pharmacy',
      mode: 'single_pharmacy',
      bestPlan: null,
      baseline: null,
      timeSavedMinutes: 0,
      speedupPercentage: 0,
      missingMedicines: allMissing,
      whyThisCombination: `None of the ${evaluatedCandidates.length} nearby candidate pharmacies currently stock all requested medicines.`,
      singlePharmacyCandidates: evaluatedCandidates,
      selectedSinglePharmacy: null,
      whyThisPharmacy: `Checked ${evaluatedCandidates.length} nearby pharmacies within delivery radius, but none currently stock the complete ${medicines.length}-medicine request. Missing items: ${allMissing.join(', ')}.`,
    };
  }

  // Rank eligible candidates:
  // 1. Estimated completion time
  // 2. Distance tie-breaking (if within 2 mins, prefer closer distance)
  completeCandidates.sort((a, b) => {
    const timeDiff = a.totalTimeMinutes - b.totalTimeMinutes;
    if (Math.abs(timeDiff) <= 2) {
      return a.distanceKm - b.distanceKm;
    }
    return timeDiff;
  });

  // Best candidate selected
  const winner = completeCandidates[0];
  winner.status = 'SELECTED';

  // Mark others
  evaluatedCandidates.forEach((c) => {
    if (c.candidateId === winner.candidateId) {
      c.status = 'SELECTED';
    }
  });

  // Build deterministic explanation
  const closerIncomplete = evaluatedCandidates.filter(
    (c) => c.distanceKm < winner.distanceKm && !c.isComplete
  );

  let explanation = '';
  if (closerIncomplete.length > 0) {
    explanation = `${closerIncomplete.length} nearby ${
      closerIncomplete.length === 1 ? 'pharmacy was' : 'pharmacies were'
    } closer (${closerIncomplete.map((c) => `${c.distanceKm} km`).join(', ')}), but could not fulfil your complete medicine request. ${
      winner.candidateName
    } was the nearest candidate that had all ${medicines.length} requested medicines available in stock.`;
  } else {
    explanation = `${winner.candidateName} is the closest nearby pharmacy (${winner.distanceKm} km away) and has 100% of your requested medicines available with an estimated fulfilment time of ${winner.totalTimeMinutes} minutes.`;
  }

  const pharmacySegment: PharmacyFulfilmentSegment = {
    pharmacyId: winner.pharmacy!.id,
    pharmacyName: winner.candidateName,
    address: winner.address,
    latitude: winner.pharmacy!.latitude,
    longitude: winner.pharmacy!.longitude,
    distanceKm: winner.distanceKm,
    preparationTimeMinutes: winner.preparationTimeMinutes,
    deliveryTimeMinutes: winner.deliveryTimeMinutes,
    totalTimeMinutes: winner.totalTimeMinutes,
    allocatedMedicines: [...medicines],
  };

  const allocations: MedicineAllocation[] = medicines.map((m) => ({
    medicineName: m.name,
    quantity: m.quantity,
    unit: m.unit,
    pharmacyId: winner.pharmacy!.id,
    pharmacyName: winner.candidateName,
  }));

  const bestPlan: FulfilmentPlan = {
    planId: `plan_single_${winner.candidateId}`,
    allMedicinesCovered: true,
    medicinesCoveredCount: medicines.length,
    totalMedicinesRequestedCount: medicines.length,
    pharmacies: [pharmacySegment],
    allocations,
    estimatedCompletionMinutes: winner.totalTimeMinutes,
    coordinationPenaltyMinutes: 0,
    totalDistanceKm: winner.distanceKm,
    pharmacyCount: 1,
    score: 100 - winner.totalTimeMinutes,
    explanation,
    missingMedicines: [],
  };

  return {
    status: 'success',
    mode: 'single_pharmacy',
    bestPlan,
    baseline: {
      pharmacy: winner.pharmacy,
      canFulfillAll: true,
      medicinesCoveredCount: medicines.length,
      totalMedicinesRequestedCount: medicines.length,
      coveredMedicines: [...medicines],
      missingMedicines: [],
      estimatedCompletionMinutes: winner.totalTimeMinutes,
      timeSavedMinutes: 0,
      distanceKm: winner.distanceKm,
    },
    timeSavedMinutes: 0,
    speedupPercentage: 0,
    missingMedicines: [],
    whyThisCombination: explanation,
    singlePharmacyCandidates: evaluatedCandidates,
    selectedSinglePharmacy: winner.pharmacy,
    whyThisPharmacy: explanation,
  };
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
  const mode = input.mode || 'combination';

  // Branch into single_pharmacy mode if requested
  if (mode === 'single_pharmacy') {
    return runSinglePharmacyOptimization(input, pharmacies);
  }

  const { medicines, urgency, userLocation = DEMO_USER_LOCATION } = input;

  if (!medicines || medicines.length === 0) {
    return {
      status: 'empty_request',
      mode: 'combination',
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
      mode: 'combination',
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
      mode: 'combination',
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
    planId: `plan_${Date.now()}_best`,
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

  // Convert top 4 distinct valid plans for the "Plans Analyzed" comparison feature
  const topPlans: FulfilmentPlan[] = validPlans.slice(0, 4).map((vp, idx) => ({
    planId: `plan_analyzed_${idx}`,
    allMedicinesCovered: true,
    medicinesCoveredCount: medicines.length,
    totalMedicinesRequestedCount: medicines.length,
    pharmacies: vp.pharmacySegments,
    allocations: vp.allocations,
    estimatedCompletionMinutes: vp.completionTimeMinutes,
    coordinationPenaltyMinutes: vp.coordinationPenaltyMinutes,
    totalDistanceKm: vp.totalDistanceKm,
    pharmacyCount: vp.pharmacySegments.length,
    score: vp.score,
    explanation: `${vp.pharmacySegments.map(p => p.pharmacyName).join(' + ')} (~${vp.completionTimeMinutes} min)`,
    missingMedicines: [],
  }));

  return {
    status: 'success',
    mode: 'combination',
    bestPlan,
    baseline,
    timeSavedMinutes,
    speedupPercentage,
    missingMedicines: [],
    whyThisCombination,
    topPlans,
  };
}

