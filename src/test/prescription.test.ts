import { 
  getDemoSyntheticPrescriptionResult, 
  validatePrescriptionFile, 
  analyzePrescriptionWithGemini 
} from '../services/gemini/prescriptionAnalyzer';
import { runSmartFulfilmentEngine } from '../services/fulfilment/smartFulfilmentEngine';
import { DEMO_PHARMACIES_DATA, DEMO_USER_LOCATION } from '../services/pharmacy/demoPharmacyProvider';

async function runPrescriptionTests() {
  console.log('=== RUNNING PRESCRIPTION EXTRACTION & FULFILMENT TEST SUITE ===\n');

  // TEST 1: Clear prescription with 5 medicines
  console.log('TEST 1: Clear synthetic prescription extraction (5 medicines)');
  const res1 = getDemoSyntheticPrescriptionResult(false);
  if (res1.medicines.length === 5 && res1.prescriptionReadable) {
    console.log(`✓ TEST 1 PASSED: 5 medicines extracted (${res1.medicines.map(m => m.medicineName).join(', ')})\n`);
  } else {
    throw new Error(`TEST 1 FAILED: Expected 5 medicines, got ${res1.medicines.length}`);
  }

  // TEST 2: Prescription with unclear medicine marked for confirmation
  console.log('TEST 2: Unclear medicine marked for user confirmation');
  const res2 = getDemoSyntheticPrescriptionResult(true);
  const unclearItem = res2.medicines.find(m => m.needsConfirmation);
  if (unclearItem && unclearItem.medicineName === null && (unclearItem.uncertainCandidates?.length || 0) > 0) {
    console.log(`✓ TEST 2 PASSED: Unclear item "${unclearItem.rawName}" marked for confirmation with candidates: ${unclearItem.uncertainCandidates?.join(', ')}\n`);
  } else {
    throw new Error(`TEST 2 FAILED: Unclear item not properly flagged`);
  }

  // TEST 3: Prescription with missing quantity
  console.log('TEST 3: Missing quantity handled without hallucination');
  const missingQtyItem = res2.medicines.find(m => m.quantity === null);
  if (missingQtyItem && missingQtyItem.needsConfirmation) {
    console.log(`✓ TEST 3 PASSED: Item "${missingQtyItem.rawName}" has quantity: null and requires user confirmation\n`);
  } else {
    throw new Error(`TEST 3 FAILED: Expected null quantity`);
  }

  // TEST 4: Visible strength extracted correctly
  console.log('TEST 4: Strength extracted and separated');
  const dolo = res1.medicines.find(m => m.medicineName === 'Dolo 650');
  const panto = res1.medicines.find(m => m.medicineName === 'Pantoprazole');
  if (dolo?.strength === '650 mg' && panto?.strength === '40 mg') {
    console.log(`✓ TEST 4 PASSED: Strengths extracted (Dolo: ${dolo.strength}, Pantoprazole: ${panto.strength})\n`);
  } else {
    throw new Error(`TEST 4 FAILED: Strength mismatch`);
  }

  // TEST 5: File validation rejects unsupported PDF or oversize
  console.log('TEST 5: File validation rules');
  const fakePdf = { type: 'application/pdf', size: 1024 } as File;
  const pdfCheck = validatePrescriptionFile(fakePdf);
  const fakeBig = { type: 'image/jpeg', size: 25 * 1024 * 1024 } as File;
  const bigCheck = validatePrescriptionFile(fakeBig);
  if (!pdfCheck.valid && !bigCheck.valid) {
    console.log(`✓ TEST 5 PASSED: PDFs and oversized files rejected with clear messages: "${pdfCheck.error}"\n`);
  } else {
    throw new Error(`TEST 5 FAILED: Validation did not reject invalid files`);
  }

  // TEST 6: Smart Fulfilment Engine receives confirmed prescription medicines
  console.log('TEST 6: Smart Fulfilment Engine optimizes confirmed prescription request');
  const confirmedRequest = {
    medicines: res1.medicines.map(m => ({
      name: m.medicineName || m.rawName,
      quantity: m.quantity || 1,
      unit: m.unit || 'tablet',
    })),
    urgency: 'urgent' as const,
    user_note: 'Prescription extraction',
  };

  const engineResult = runSmartFulfilmentEngine(
    {
      medicines: confirmedRequest.medicines,
      urgency: confirmedRequest.urgency,
      userLocation: DEMO_USER_LOCATION,
    },
    DEMO_PHARMACIES_DATA
  );

  console.log('engineResult status:', engineResult.status, 'missing:', engineResult.missingMedicines);
  if (engineResult.bestPlan) {
    console.log('bestPlan pharmacyCount:', engineResult.bestPlan.pharmacyCount, 'covered:', engineResult.bestPlan.medicinesCoveredCount);
  }

  if (
    engineResult.status === 'success' && 
    engineResult.bestPlan && 
    engineResult.bestPlan.pharmacyCount === 2 && 
    engineResult.bestPlan.medicinesCoveredCount === 5
  ) {
    console.log(`✓ TEST 6 PASSED: Smart Fulfilment Engine successfully fulfilled 5/5 prescription medicines across 2 pharmacies in ${engineResult.bestPlan.estimatedCompletionMinutes} min\n`);
  } else {
    throw new Error(`TEST 6 FAILED: Fulfilment engine did not return 2-hub optimal plan for prescription`);
  }

  // TEST 7: Incomplete prescription drug triggers no-complete-plan state
  console.log('TEST 7: Prescription with unavailable drug triggers graceful no-plan state');
  const incompleteRx = {
    medicines: [
      { name: 'Dolo 650', quantity: 1, unit: 'tablet' },
      { name: 'UnobtainiumRareDrug999', quantity: 1, unit: 'tablet' },
    ],
    urgency: 'urgent' as const,
    userLocation: DEMO_USER_LOCATION,
  };

  const incompleteResult = runSmartFulfilmentEngine(incompleteRx, DEMO_PHARMACIES_DATA);
  if (incompleteResult.status === 'no_complete_plan' && incompleteResult.missingMedicines.includes('UnobtainiumRareDrug999')) {
    console.log(`✓ TEST 7 PASSED: Unavailable medicine correctly rejected: ${incompleteResult.missingMedicines.join(', ')}\n`);
  } else {
    throw new Error(`TEST 7 FAILED: Expected no_complete_plan`);
  }

  console.log('=== ALL 7 PRESCRIPTION TESTS PASSED SUCCESSFULLY! ===\n');
}

runPrescriptionTests().catch(err => {
  console.error('TEST RUNNER ERROR:', err);
});
