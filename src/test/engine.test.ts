import { runSmartFulfilmentEngine } from '../services/fulfilment/smartFulfilmentEngine';
import { DEMO_PHARMACIES_DATA } from '../services/pharmacy/demoPharmacyProvider';
import { normalizeMedicineName } from '../utils/medicineNormalization';

console.log('=== RUNNING SMART FULFILMENT ENGINE TEST SUITE ===\n');

let passedCount = 0;
let totalCount = 5;

// TEST 1 — Combination beats single pharmacy
console.log('TEST 1: Combination beats single pharmacy');
const result1 = runSmartFulfilmentEngine(
  {
    medicines: [
      { name: 'Dolo 650', quantity: 1, unit: 'strip' },
      { name: 'Pantoprazole', quantity: 1, unit: 'strip' },
      { name: 'Azithromycin', quantity: 1, unit: 'strip' },
      { name: 'ORS', quantity: 1, unit: 'sachet' },
      { name: 'Cetirizine', quantity: 1, unit: 'strip' },
    ],
    urgency: 'urgent',
  },
  DEMO_PHARMACIES_DATA
);

if (
  result1.status === 'success' &&
  result1.bestPlan &&
  result1.bestPlan.pharmacyCount === 2 &&
  result1.bestPlan.estimatedCompletionMinutes < (result1.baseline?.estimatedCompletionMinutes || 99)
) {
  console.log(`✓ TEST 1 PASSED: 2-hub combination (${result1.bestPlan.pharmacies.map(p => p.pharmacyName).join(' + ')}) completed in ${result1.bestPlan.estimatedCompletionMinutes} min vs Single Pharmacy in ${result1.baseline?.estimatedCompletionMinutes} min (Time saved: ${result1.timeSavedMinutes} min).`);
  passedCount++;
} else {
  console.error('✗ TEST 1 FAILED:', result1);
}

// TEST 2 — Single pharmacy wins
console.log('\nTEST 2: Single pharmacy wins when it has everything and is fastest');
const result2 = runSmartFulfilmentEngine(
  {
    medicines: [
      { name: 'Dolo 650', quantity: 1, unit: 'strip' },
      { name: 'Pantoprazole', quantity: 1, unit: 'strip' },
    ],
    urgency: 'normal',
  },
  DEMO_PHARMACIES_DATA
);

if (
  result2.status === 'success' &&
  result2.bestPlan &&
  result2.bestPlan.pharmacyCount === 1 &&
  result2.bestPlan.pharmacies[0].pharmacyName === 'CityCare Pharmacy'
) {
  console.log(`✓ TEST 2 PASSED: Single pharmacy (${result2.bestPlan.pharmacies[0].pharmacyName}) chosen in ${result2.bestPlan.estimatedCompletionMinutes} min.`);
  passedCount++;
} else {
  console.error('✗ TEST 2 FAILED:', result2);
}

// TEST 3 — No complete fulfilment
console.log('\nTEST 3: No complete fulfilment when requested drug is missing in network');
const result3 = runSmartFulfilmentEngine(
  {
    medicines: [
      { name: 'Dolo 650', quantity: 1, unit: 'strip' },
      { name: 'NonExistentMedicineXYZ', quantity: 1, unit: 'strip' },
    ],
    urgency: 'normal',
  },
  DEMO_PHARMACIES_DATA
);

if (
  result3.status === 'no_complete_plan' &&
  result3.missingMedicines.includes('NonExistentMedicineXYZ')
) {
  console.log(`✓ TEST 3 PASSED: Incomplete request rejected correctly. Missing: ${result3.missingMedicines.join(', ')}`);
  passedCount++;
} else {
  console.error('✗ TEST 3 FAILED:', result3);
}

// TEST 4 — Quantity check
console.log('\nTEST 4: Quantity check (inventory quantity constraint)');
// QuickCare only has 2 Dolo 650 available. Requesting 3 should mean QuickCare cannot fulfill it alone.
const result4 = runSmartFulfilmentEngine(
  {
    medicines: [
      { name: 'ORS', quantity: 1, unit: 'sachet' },
      { name: 'Cetirizine', quantity: 1, unit: 'strip' },
      { name: 'Dolo 650', quantity: 3, unit: 'strip' }, // QuickCare only has 2
    ],
    urgency: 'normal',
  },
  DEMO_PHARMACIES_DATA
);

// QuickCare cannot supply Dolo 650 (only has 2). CityCare (has 50) or another store must supply Dolo.
const doloSupplier = result4.bestPlan?.allocations.find(a => a.medicineName === 'Dolo 650');
if (
  result4.status === 'success' &&
  result4.bestPlan &&
  doloSupplier &&
  doloSupplier.pharmacyName !== 'QuickCare Pharmacy'
) {
  console.log(`✓ TEST 4 PASSED: QuickCare (stock: 2) was skipped for Dolo x 3; assigned to ${doloSupplier.pharmacyName}.`);
  passedCount++;
} else {
  console.error('✗ TEST 4 FAILED:', result4);
}

// TEST 5 — Case and formatting normalization
console.log('\nTEST 5: Case and formatting normalization');
const testCases = ['Dolo 650', 'dolo 650', '  DOLO   650  ', 'DOLO-650'];
const normalized = testCases.map(normalizeMedicineName);
const allEqual = normalized.every(n => n === normalized[0]);

if (allEqual) {
  console.log(`✓ TEST 5 PASSED: All variations normalized to "${normalized[0]}".`);
  passedCount++;
} else {
  console.error('✗ TEST 5 FAILED:', normalized);
}

console.log(`\n=== TEST SUITE RESULT: ${passedCount}/${totalCount} TESTS PASSED ===\n`);
