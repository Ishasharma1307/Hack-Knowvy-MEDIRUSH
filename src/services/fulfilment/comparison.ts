import { MedicineItem, Pharmacy, FulfilmentPlan, ComparisonResult, SinglePharmacyBenchmark } from '../../types';
import { pharmacyHasMedicine } from './engine';

/**
 * Benchmarks MediRush's multi-pharmacy smart fulfilment against
 * the traditional single-pharmacy approach (the store with the most medicines in stock).
 */
export function compareWithSinglePharmacy(
  medicines: MedicineItem[],
  pharmacies: Pharmacy[],
  smartPlan: FulfilmentPlan
): ComparisonResult {
  const openPharmacies = pharmacies.filter(p => p.isOpen);

  let bestSingleStore: Pharmacy | null = null;
  let bestCoveredMeds: MedicineItem[] = [];
  let bestMissingMeds: MedicineItem[] = [];
  let bestScore = -1;

  for (const store of openPharmacies) {
    const covered: MedicineItem[] = [];
    const missing: MedicineItem[] = [];

    medicines.forEach(m => {
      if (pharmacyHasMedicine(store, m)) {
        covered.push(m);
      } else {
        missing.push(m);
      }
    });

    // Score prioritizing coverage, then fastest delivery
    // 100 points per covered medicine - total ETA
    const storeScore = covered.length * 100 - store.totalEtaMin;

    if (storeScore > bestScore) {
      bestScore = storeScore;
      bestSingleStore = store;
      bestCoveredMeds = covered;
      bestMissingMeds = missing;
    }
  }

  const singleEstimatedTimeMin = bestSingleStore ? bestSingleStore.totalEtaMin : 45;
  const isComplete = bestCoveredMeds.length === medicines.length;

  const singleBenchmark: SinglePharmacyBenchmark = {
    pharmacy: bestSingleStore,
    medicinesCovered: bestCoveredMeds,
    missingMedicines: bestMissingMeds,
    estimatedTimeMin: singleEstimatedTimeMin,
    timeSavedMin: Math.max(0, singleEstimatedTimeMin - smartPlan.estimatedTotalTimeMin),
    speedupPercentage: singleEstimatedTimeMin > 0
      ? Math.round(((singleEstimatedTimeMin - smartPlan.estimatedTotalTimeMin) / singleEstimatedTimeMin) * 100)
      : 0,
    isComplete,
  };

  const timeSavedMin = Math.max(0, singleEstimatedTimeMin - smartPlan.estimatedTotalTimeMin);
  const speedupPercentage = singleBenchmark.speedupPercentage;

  let whyBetter = "";
  if (!singleBenchmark.isComplete) {
    whyBetter = `The best single pharmacy (${bestSingleStore?.name}) only has ${bestCoveredMeds.length} of ${medicines.length} medicines in stock. MediRush combines 2 nearby pharmacies to give you 100% full prescription fulfilment ${timeSavedMin > 0 ? `and saves ${timeSavedMin} mins` : ''}.`;
  } else if (smartPlan.pharmacyCount > 1) {
    whyBetter = `Single store (${bestSingleStore?.name}) is ${bestSingleStore?.distanceKm}km away taking ~${singleEstimatedTimeMin} mins. By splitting the order across 2 closer express hubs dispatching simultaneously, MediRush completes your entire prescription in ~${smartPlan.estimatedTotalTimeMin} mins (saving ${timeSavedMin} minutes).`;
  } else {
    whyBetter = `MediRush verified that ${smartPlan.selectedPharmacies[0]?.pharmacy.name} can fulfill 100% of medicines within the fastest possible timeframe (~${smartPlan.estimatedTotalTimeMin} mins).`;
  }

  return {
    smartPlan,
    singleBenchmark,
    timeSavedMin,
    speedupPercentage,
    whyBetter,
  };
}
