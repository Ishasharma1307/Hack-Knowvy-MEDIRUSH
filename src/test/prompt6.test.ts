import { runSmartFulfilmentEngine } from '../services/fulfilment/smartFulfilmentEngine';
import { DEMO_PHARMACIES_DATA, DEMO_USER_LOCATION } from '../services/pharmacy/demoPharmacyProvider';
import { matchCandidateToPharmacyInventory, mapCandidatesToInventoryPharmacies } from '../services/pharmacy/pharmacyMatcher';
import { getTopNearbyPharmacies } from '../services/pharmacy/nearbyPharmacyService';

async function runTests() {
  console.log('--- STARTING PROMPT 6 ENGINE TESTS ---');

  const demo5Meds = [
    { name: 'Dolo 650', quantity: 1, unit: 'strip' },
    { name: 'Pantoprazole', quantity: 1, unit: 'strip' },
    { name: 'Azithromycin', quantity: 1, unit: 'strip' },
    { name: 'ORS', quantity: 1, unit: 'sachet' },
    { name: 'Cetirizine', quantity: 1, unit: 'strip' },
  ];

  // TEST 1: Nearest pharmacy has all medicines
  console.log('\n[TEST 1] Nearest pharmacy has all medicines');
  const candidates1 = [
    { ...DEMO_PHARMACIES_DATA[0], distanceKm: 1.0 }, // CityCare (has all 5)
    { ...DEMO_PHARMACIES_DATA[1], distanceKm: 2.0 }, // QuickCare (has 3/5)
  ];
  const res1 = runSmartFulfilmentEngine(
    { medicines: demo5Meds, urgency: 'urgent', userLocation: DEMO_USER_LOCATION, mode: 'single_pharmacy' },
    candidates1 as any
  );
  console.log('Result 1 status:', res1.status);
  console.log('Selected pharmacy:', res1.selectedSinglePharmacy?.name);
  if (res1.selectedSinglePharmacy?.id !== 'pharm_citycare') throw new Error('TEST 1 FAILED');
  console.log('TEST 1 PASSED: Nearest complete pharmacy selected.');

  // TEST 2: Nearest pharmacy missing one medicine -> Must skip it!
  console.log('\n[TEST 2] Nearest pharmacy missing one medicine -> Must skip it!');
  // QuickCare is closer (0.6 km, 3/5), CityCare is further (1.2 km, 5/5)
  const candidates2 = [
    { ...DEMO_PHARMACIES_DATA[1], distanceKm: 0.6, latitude: 12.9710, longitude: 77.5950 }, // QuickCare (3/5)
    { ...DEMO_PHARMACIES_DATA[0], distanceKm: 1.2, latitude: 12.9782, longitude: 77.6408 }, // CityCare (5/5)
  ];
  const res2 = runSmartFulfilmentEngine(
    { medicines: demo5Meds, urgency: 'urgent', userLocation: DEMO_USER_LOCATION, mode: 'single_pharmacy' },
    candidates2 as any
  );
  console.log('Result 2 selected:', res2.selectedSinglePharmacy?.name);
  console.log('Why:', res2.whyThisPharmacy);
  if (res2.selectedSinglePharmacy?.id !== 'pharm_citycare') throw new Error('TEST 2 FAILED');
  console.log('TEST 2 PASSED: Incomplete closer pharmacy correctly skipped for complete pharmacy!');

  // TEST 3: Multiple pharmacies have all medicines -> Best scored selected
  console.log('\n[TEST 3] Multiple complete pharmacies -> Deterministic ranking');
  const candidates3 = [
    { ...DEMO_PHARMACIES_DATA[0], distanceKm: 1.5, preparationTimeMinutes: 5, deliveryTimeMinutes: 8 }, // CityCare 13 min
    { ...DEMO_PHARMACIES_DATA[2], distanceKm: 4.0, preparationTimeMinutes: 12, deliveryTimeMinutes: 15 }, // LifeLine 27 min
  ];
  const res3 = runSmartFulfilmentEngine(
    { medicines: demo5Meds, urgency: 'urgent', userLocation: DEMO_USER_LOCATION, mode: 'single_pharmacy' },
    candidates3 as any
  );
  console.log('Result 3 selected:', res3.selectedSinglePharmacy?.name);
  if (res3.selectedSinglePharmacy?.id !== 'pharm_citycare') throw new Error('TEST 3 FAILED');
  console.log('TEST 3 PASSED: Fastest complete pharmacy selected.');

  // TEST 4: No pharmacy has all medicines -> returns no_single_pharmacy
  console.log('\n[TEST 4] No single pharmacy has all medicines');
  const candidates4 = [
    { ...DEMO_PHARMACIES_DATA[1] }, // QuickCare (missing Panto & Azithro)
    { ...DEMO_PHARMACIES_DATA[4] }, // Sunrise (missing Panto & Azithro & Dolo)
  ];
  const res4 = runSmartFulfilmentEngine(
    { medicines: demo5Meds, urgency: 'urgent', userLocation: DEMO_USER_LOCATION, mode: 'single_pharmacy' },
    candidates4 as any
  );
  console.log('Result 4 status:', res4.status);
  console.log('Missing items:', res4.missingMedicines);
  if (res4.status !== 'no_single_pharmacy') throw new Error('TEST 4 FAILED');
  console.log('TEST 4 PASSED: Gracefully returns no_single_pharmacy with missing item list.');

  // TEST 5: Top 5 Nearby Discovery Fallback
  console.log('\n[TEST 5] Nearby Pharmacy Discovery');
  const discovery = await getTopNearbyPharmacies(DEMO_USER_LOCATION, 5);
  console.log('Discovery candidates count:', discovery.candidates.length);
  console.log('Discovery candidate names:', discovery.candidates.map(c => `${c.name} (${c.distanceKm} km)`));
  if (discovery.candidates.length !== 5) throw new Error('TEST 5 FAILED');
  console.log('TEST 5 PASSED: 5 structured candidates returned.');

  // TEST 9: Quantity unavailable -> Reject if insufficient stock
  console.log('\n[TEST 9] Quantity unavailable -> Rejected if insufficient stock');
  const hugeDemandMeds = [
    { name: 'Dolo 650', quantity: 99999, unit: 'strip' }
  ];
  const res9 = runSmartFulfilmentEngine(
    { medicines: hugeDemandMeds, urgency: 'urgent', userLocation: DEMO_USER_LOCATION, mode: 'single_pharmacy' },
    DEMO_PHARMACIES_DATA
  );
  console.log('Result 9 status:', res9.status);
  if (res9.status !== 'no_single_pharmacy') throw new Error('TEST 9 FAILED');
  console.log('TEST 9 PASSED: Out of stock pharmacy rejected.');

  console.log('\n=============================================');
  console.log('SUCCESS: ALL PROMPT 6 TEST CASES VERIFIED 100%!');
  console.log('=============================================\n');
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
