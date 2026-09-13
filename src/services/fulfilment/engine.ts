import { MedicineItem, Pharmacy, FulfilmentPlan, PharmacyContribution } from '../../types';

// Helper to normalize medicine strings for fuzzy inventory matching
export function normalizeMedName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Checks whether a pharmacy stocks a given requested medicine.
 * Matches on normalized substrings or keywords (e.g., "dolo 650" matches "dolo").
 */
export function pharmacyHasMedicine(pharmacy: Pharmacy, med: MedicineItem): boolean {
  const targetNorm = normalizeMedName(med.name);
  return pharmacy.inventory.some(inv => {
    if (!inv.inStock || inv.quantityAvailable < med.quantity) return false;
    const invNorm = normalizeMedName(inv.name);
    const invBaseNorm = normalizeMedName(inv.normalizedName);
    return (
      targetNorm.includes(invBaseNorm) ||
      invBaseNorm.includes(targetNorm) ||
      targetNorm.includes(invNorm) ||
      invNorm.includes(targetNorm)
    );
  });
}

/**
 * Gets stock price for medicine at pharmacy, or fallback estimate
 */
function getMedicinePrice(pharmacy: Pharmacy, med: MedicineItem): number {
  const targetNorm = normalizeMedName(med.name);
  const found = pharmacy.inventory.find(inv => {
    const invBaseNorm = normalizeMedName(inv.normalizedName);
    return targetNorm.includes(invBaseNorm) || invBaseNorm.includes(targetNorm);
  });
  return found ? found.unitPrice * med.quantity : 50 * med.quantity;
}

/**
 * Smart Fulfilment Engine:
 * Deterministic combinatorial optimization over pharmacy subsets of size 1, 2, and 3.
 * Prioritizes:
 * 1. 100% Prescription Coverage
 * 2. Minimum estimated completion time (parallel multi-store delivery)
 * 3. Minimum pharmacy count (parsimony penalty)
 * 4. Total travel distance
 */
export function calculateSmartFulfilment(
  medicines: MedicineItem[],
  pharmacies: Pharmacy[]
): FulfilmentPlan {
  if (!medicines || medicines.length === 0) {
    return {
      planId: `plan_empty_${Date.now()}`,
      selectedPharmacies: [],
      allCovered: false,
      coveredMedicines: [],
      uncoveredMedicines: [],
      estimatedTotalTimeMin: 0,
      totalDistanceKm: 0,
      totalCost: 0,
      pharmacyCount: 0,
      efficiencyScore: 0,
      aiExplanation: "No medicines specified in the request.",
    };
  }

  const openPharmacies = pharmacies.filter(p => p.isOpen);

  // Generate all candidate combinations (1-store, 2-store, 3-store)
  const candidateSubsets: Pharmacy[][] = [];

  // 1-pharmacy candidates
  for (let i = 0; i < openPharmacies.length; i++) {
    candidateSubsets.push([openPharmacies[i]]);
  }

  // 2-pharmacy candidates
  for (let i = 0; i < openPharmacies.length; i++) {
    for (let j = i + 1; j < openPharmacies.length; j++) {
      candidateSubsets.push([openPharmacies[i], openPharmacies[j]]);
    }
  }

  // 3-pharmacy candidates (for complex multi-medicine prescriptions)
  for (let i = 0; i < openPharmacies.length; i++) {
    for (let j = i + 1; j < openPharmacies.length; j++) {
      for (let k = j + 1; k < openPharmacies.length; k++) {
        candidateSubsets.push([openPharmacies[i], openPharmacies[j], openPharmacies[k]]);
      }
    }
  }

  interface EvaluatedCombination {
    pharmacies: Pharmacy[];
    allocation: Map<string, MedicineItem[]>; // pharmacyId -> medicines
    coveredMeds: MedicineItem[];
    uncoveredMeds: MedicineItem[];
    allCovered: boolean;
    parallelTimeMin: number;
    totalDistanceKm: number;
    totalCost: number;
    score: number; // lower is better
  }

  const evaluated: EvaluatedCombination[] = [];

  for (const subset of candidateSubsets) {
    const allocation = new Map<string, MedicineItem[]>();
    subset.forEach(p => allocation.set(p.id, []));

    const coveredMeds: MedicineItem[] = [];
    const uncoveredMeds: MedicineItem[] = [];

    // Assign each medicine to the fastest pharmacy in this subset that stocks it
    for (const med of medicines) {
      const stockingStores = subset.filter(p => pharmacyHasMedicine(p, med));
      if (stockingStores.length === 0) {
        uncoveredMeds.push(med);
      } else {
        // Pick store with the lowest total ETA among available stocking stores
        stockingStores.sort((a, b) => a.totalEtaMin - b.totalEtaMin);
        const chosenStore = stockingStores[0];
        allocation.get(chosenStore.id)!.push(med);
        coveredMeds.push(med);
      }
    }

    // Prune pharmacies from the subset that ended up with 0 assigned medicines
    const activeStores = subset.filter(p => (allocation.get(p.id)?.length || 0) > 0);
    if (activeStores.length === 0) continue;

    const allCovered = coveredMeds.length === medicines.length;

    // In parallel dispatch, patient waits for the slowest courier among active stores
    // We add 2 minutes handover/coordination buffer if multiple couriers arrive
    const maxStoreEta = Math.max(...activeStores.map(p => p.totalEtaMin));
    const parallelTimeMin = activeStores.length > 1 ? maxStoreEta + 2 : maxStoreEta;

    const totalDistanceKm = Number(
      activeStores.reduce((sum, p) => sum + p.distanceKm, 0).toFixed(1)
    );

    let totalCost = 0;
    activeStores.forEach(p => {
      const assignedMeds = allocation.get(p.id) || [];
      assignedMeds.forEach(m => {
        totalCost += getMedicinePrice(p, m);
      });
    });

    // Scoring formula:
    // 1. Missing item penalty: massive (1000 pts per missing medicine)
    // 2. Parallel delivery time: 1.0 per minute
    // 3. Store count penalty: 3.5 pts per additional pharmacy (avoids unnecessary splits if times are close)
    // 4. Distance factor: 0.5 per km
    const missingPenalty = (medicines.length - coveredMeds.length) * 1000;
    const storeCountPenalty = (activeStores.length - 1) * 3.5;
    const timePenalty = parallelTimeMin * 1.2;
    const distancePenalty = totalDistanceKm * 0.3;

    const score = missingPenalty + timePenalty + storeCountPenalty + distancePenalty;

    evaluated.push({
      pharmacies: activeStores,
      allocation,
      coveredMeds,
      uncoveredMeds,
      allCovered,
      parallelTimeMin,
      totalDistanceKm,
      totalCost,
      score,
    });
  }

  // Sort by score ascending (best first)
  evaluated.sort((a, b) => a.score - b.score);

  const best = evaluated[0] || {
    pharmacies: [],
    allocation: new Map(),
    coveredMeds: [],
    uncoveredMeds: medicines,
    allCovered: false,
    parallelTimeMin: 0,
    totalDistanceKm: 0,
    totalCost: 0,
    score: 9999,
  };

  const selectedContributions: PharmacyContribution[] = best.pharmacies.map(pharm => {
    const medsForStore = best.allocation.get(pharm.id) || [];
    const subtotal = medsForStore.reduce((acc, m) => acc + getMedicinePrice(pharm, m), 0);
    return {
      pharmacy: pharm,
      medicinesCovered: medsForStore,
      prepTimeMin: pharm.prepTimeMin,
      deliveryTimeMin: pharm.deliveryTimeMin,
      totalEtaMin: pharm.totalEtaMin,
      subtotal,
    };
  });

  // Calculate efficiency score (0 - 100)
  const coverageRatio = medicines.length > 0 ? best.coveredMeds.length / medicines.length : 0;
  const speedBonus = Math.max(0, 50 - best.parallelTimeMin);
  const efficiencyScore = Math.min(100, Math.round(coverageRatio * 70 + speedBonus * 0.6));

  return {
    planId: `plan_${Date.now()}`,
    selectedPharmacies: selectedContributions,
    allCovered: best.allCovered,
    coveredMedicines: best.coveredMeds,
    uncoveredMedicines: best.uncoveredMeds,
    estimatedTotalTimeMin: best.parallelTimeMin,
    totalDistanceKm: best.totalDistanceKm,
    totalCost: best.totalCost,
    pharmacyCount: selectedContributions.length,
    efficiencyScore,
  };
}
