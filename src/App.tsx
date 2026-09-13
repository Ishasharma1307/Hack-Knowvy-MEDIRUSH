import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { RequestPage } from './pages/RequestPage';
import { UnderstandingPage } from './pages/UnderstandingPage';
import { ResultsPage } from './pages/ResultsPage';
import { OrderSummaryPage } from './pages/OrderSummaryPage';
import { PrescriptionReviewPage } from './pages/PrescriptionReviewPage';
import { OrderConfirmedPage } from './pages/OrderConfirmedPage';
import { OrderPipelineProgress } from './components/order/OrderPipelineProgress';

import { 
  MedicineItem, 
  UrgencyLevel, 
  SamplePrescription, 
  StructuredMedicineRequest 
} from './types';
import { Pharmacy, DemoLocation } from './types/pharmacy';
import { Order, PharmacyCandidateEvaluation } from './types/order';
import { demoPharmacyProvider, DEMO_USER_LOCATION } from './services/pharmacy/demoPharmacyProvider';
import { extractMedicinesWithAI } from './services/ai/geminiService';
import { analyzePrescriptionWithGemini, PrescriptionAnalysisResult } from './services/gemini/prescriptionAnalyzer';
import { runSmartFulfilmentEngine } from './services/fulfilment/smartFulfilmentEngine';
import { EngineResult } from './services/fulfilment/types';
import { getUserLocation, UserLocationResult } from './services/location/locationService';
import { getTopNearbyPharmacies } from './services/pharmacy/nearbyPharmacyService';
import { mapCandidatesToInventoryPharmacies } from './services/pharmacy/pharmacyMatcher';
import { createMedicineOrder } from './services/order/orderService';

export const App: React.FC = () => {
  // Navigation View State
  const [currentView, setCurrentView] = useState<
    'home' | 'request' | 'understanding' | 'prescription_review' | 'results' | 'order_summary' | 'order_confirmed'
  >('home');
  const [requestDefaultMode, setRequestDefaultMode] = useState<'text' | 'prescription' | 'manual'>('text');

  // Domain Data State
  const [allPharmacies, setAllPharmacies] = useState<Pharmacy[]>([]);
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [urgency, setUrgency] = useState<UrgencyLevel>('urgent');
  const [userNote, setUserNote] = useState<string>('');
  const [extractionSource, setExtractionSource] = useState<'gemini' | 'fallback' | 'demo'>('gemini');
  const [safetyAlert, setSafetyAlert] = useState<string | undefined>(undefined);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [prefillSample, setPrefillSample] = useState<SamplePrescription | null>(null);

  // Prescription Analysis State
  const [prescriptionAnalysis, setPrescriptionAnalysis] = useState<PrescriptionAnalysisResult | null>(null);
  const [isPrescriptionSource, setIsPrescriptionSource] = useState<boolean>(false);

  // Engine Optimization Result State
  const [confirmedRequest, setConfirmedRequest] = useState<StructuredMedicineRequest | null>(null);
  const [engineResult, setEngineResult] = useState<EngineResult | null>(null);

  // Order Pipeline State (Prompt 6)
  const [orderPipelineActive, setOrderPipelineActive] = useState<boolean>(false);
  const [orderPipelineStep, setOrderPipelineStep] = useState<number>(1);
  const [orderPipelineDetail, setOrderPipelineDetail] = useState<string>('');
  const [orderPipelineProvider, setOrderPipelineProvider] = useState<'google_maps' | 'demo'>('demo');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [orderCandidatesChecked, setOrderCandidatesChecked] = useState<PharmacyCandidateEvaluation[]>([]);
  const [orderNoSinglePharmacy, setOrderNoSinglePharmacy] = useState<boolean>(false);
  const [orderMissingMedicines, setOrderMissingMedicines] = useState<string[]>([]);
  const [liveUserLocation, setLiveUserLocation] = useState<UserLocationResult | null>(null);

  // Loading States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Initialize Pharmacies and detect user's real location on initial load
  useEffect(() => {
    async function initData() {
      const stores = await demoPharmacyProvider.getPharmacies();
      setAllPharmacies(stores);

      try {
        const detected = await getUserLocation(5000);
        setLiveUserLocation(detected);
      } catch (_e) {}
    }
    initData();
  }, []);

  // Handler: Analyze Natural Language or Manual Prescription
  const handleAnalyzeRequest = async (prompt: string, manualItems?: MedicineItem[], selectedUrgency?: UrgencyLevel) => {
    setIsAnalyzing(true);
    setRequestError(null);
    setSafetyAlert(undefined);

    try {
      if (manualItems && manualItems.length > 0) {
        setMedicines(manualItems);
        setUrgency(selectedUrgency || 'urgent');
        setUserNote('User manually entered prescription items');
        setExtractionSource('fallback');
        setCurrentView('understanding');
      } else {
        const result = await extractMedicinesWithAI(prompt);

        if (result.requiresPrescriptionDetails && result.medicines.length === 0) {
          setRequestError(
            result.safetyAlert ||
            "No specific medicine names were detected in your request. Please specify the medicine names (e.g. Dolo 650, Pantoprazole) or add them manually."
          );
          return;
        }

        if (result.isConsultationQuery) {
          setRequestError(
            result.safetyAlert ||
            "MediRush does not diagnose or prescribe medications. Please consult a licensed doctor or pharmacist."
          );
          return;
        }

        setMedicines(result.medicines);
        setUrgency(result.urgency || selectedUrgency || 'urgent');
        setUserNote(result.user_note || prompt.trim());
        setExtractionSource(result.source);
        setSafetyAlert(result.safetyAlert);
        setCurrentView('understanding');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setRequestError("AI couldn't understand the request. You can enter medicines manually or load a demo scenario.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handler: Analyze Uploaded Prescription Image via Gemini Vision
  const handleAnalyzePrescription = async (base64: string, mimeType: string, isDemoPreset?: boolean, demoPrescriptionText?: string) => {
    setIsAnalyzing(true);
    setRequestError(null);
    setSafetyAlert(undefined);

    try {
      const result = await analyzePrescriptionWithGemini(base64, mimeType, isDemoPreset, demoPrescriptionText);
      setPrescriptionAnalysis(result);
      setIsPrescriptionSource(true);

      if (!result.prescriptionReadable || result.medicines.length === 0) {
        setRequestError("Couldn't read medicines from the prescription. Please try a clearer photo or enter medicines manually.");
        return;
      }

      if (result.warning) {
        setSafetyAlert(result.warning);
      }

      setCurrentView('prescription_review');
    } catch (err: any) {
      console.error('Prescription analysis error:', err);
      setRequestError("Couldn't analyze the prescription. Please enter medicines manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * PROMPT 6: CORE FINAL ORDER PIPELINE
   * User confirms medicines -> Clicks "Order Medicines"
   * 1. Get User Location (browser geolocation or fallback demo)
   * 2. Gemini + Google Maps -> Top 5 nearby candidate pharmacies
   * 3. Inventory availability check on candidate pharmacies
   * 4. Smart Fulfilment Engine (single_pharmacy mode) -> Ranks by complete availability, distance, ETA
   * 5. Creates Order & displays confirmation
   */
  const handleExecuteOrderPipeline = async (structuredReq: StructuredMedicineRequest) => {
    setConfirmedRequest(structuredReq);
    setOrderPipelineActive(true);
    setOrderPipelineStep(1);
    setOrderPipelineDetail('Accessing user location and searching nearby pharmacies...');

    try {
      // 1. Ensure latest pharmacy dataset loaded
      const pharmacies = await demoPharmacyProvider.getPharmacies();
      setAllPharmacies(pharmacies);

      // STEP 1: USER LOCATION & NEARBY DISCOVERY
      const loc = await getUserLocation(6000);
      setLiveUserLocation(loc);
      setOrderPipelineDetail(`Location: ${loc.address}. Finding nearest pharmacies with Gemini...`);

      const discoveryResult = await getTopNearbyPharmacies(
        { latitude: loc.latitude, longitude: loc.longitude, address: loc.address },
        5
      );

      setOrderPipelineProvider(discoveryResult.providerType);
      setOrderPipelineDetail(`Discovered ${discoveryResult.candidates.length} candidate stores (${discoveryResult.sourceDescription})`);
      await new Promise((r) => setTimeout(r, 700));

      // STEP 2: INVENTORY AVAILABILITY CHECK
      setOrderPipelineStep(2);
      setOrderPipelineDetail(`Checking complete medicine availability against MediRush pharmacy inventory...`);

      const mapped = mapCandidatesToInventoryPharmacies(discoveryResult.candidates, pharmacies);
      const candidatePharmacies: Pharmacy[] = mapped.map(({ candidate, pharmacy }) => {
        if (pharmacy) {
          return {
            ...pharmacy,
            latitude: candidate.latitude,
            longitude: candidate.longitude,
            address: candidate.address || pharmacy.address,
            name: candidate.name || pharmacy.name,
          };
        }
        return {
          id: candidate.id,
          name: candidate.name,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
          address: candidate.address,
          open: candidate.open,
          preparationTimeMinutes: 5,
          deliveryTimeMinutes: Math.round(candidate.distanceKm * 2.5),
          inventory: [],
        };
      });

      await new Promise((r) => setTimeout(r, 700));

      // STEP 3: SMART FULFILMENT ENGINE (single_pharmacy mode)
      setOrderPipelineStep(3);
      setOrderPipelineDetail('Filtering for complete stock fulfilment and minimum travel distance...');

      const singleResult = runSmartFulfilmentEngine(
        {
          medicines: structuredReq.medicines,
          urgency: structuredReq.urgency,
          userLocation: {
            latitude: loc.latitude,
            longitude: loc.longitude,
            address: loc.address,
          },
          mode: 'single_pharmacy',
        },
        candidatePharmacies
      );

      await new Promise((r) => setTimeout(r, 700));

      // STEP 4: ORDER CREATION
      setOrderPipelineStep(4);
      setOrderPipelineDetail('Creating order record and reserving pharmacy inventory...');

      const candidateEvaluations: PharmacyCandidateEvaluation[] = (singleResult.singlePharmacyCandidates || []).map((c) => ({
        candidateId: c.candidateId,
        candidateName: c.candidateName,
        id: c.candidateId,
        name: c.candidateName,
        address: c.address,
        distanceKm: c.distanceKm,
        open: c.open,
        medicinesAvailableCount: c.medicinesAvailableCount,
        totalMedicinesRequestedCount: c.totalMedicinesRequestedCount,
        isComplete: c.isComplete,
        status: c.status,
        missingMedicines: c.missingMedicines,
        preparationTimeMinutes: c.preparationTimeMinutes,
        deliveryTimeMinutes: c.deliveryTimeMinutes,
        totalTimeMinutes: c.totalTimeMinutes,
      }));

      if (singleResult.status === 'success' && singleResult.selectedSinglePharmacy) {
        const order = await createMedicineOrder({
          userLocation: {
            latitude: loc.latitude,
            longitude: loc.longitude,
            address: loc.address,
          },
          medicines: structuredReq.medicines.map((m, idx) => ({
            id: `med_${idx + 1}`,
            name: m.name,
            quantity: m.quantity,
            unit: m.unit,
            urgency: structuredReq.urgency,
          })),
          selectedPharmacy: singleResult.selectedSinglePharmacy,
          source: isPrescriptionSource ? 'prescription' : 'manual',
          urgency: structuredReq.urgency,
          candidatesChecked: candidateEvaluations,
          whyThisPharmacy: singleResult.whyThisPharmacy || singleResult.whyThisCombination,
        });

        setConfirmedOrder(order);
        setOrderCandidatesChecked(candidateEvaluations);
        setOrderNoSinglePharmacy(false);
        setOrderMissingMedicines([]);
      } else {
        setConfirmedOrder(null);
        setOrderCandidatesChecked(candidateEvaluations);
        setOrderNoSinglePharmacy(true);
        setOrderMissingMedicines(singleResult.missingMedicines || []);
      }

      await new Promise((r) => setTimeout(r, 600));
      setOrderPipelineActive(false);
      setCurrentView('order_confirmed');
    } catch (err) {
      console.error('[MediRush Pipeline Error]:', err);
      setOrderPipelineActive(false);
      // Fallback to error view
      setOrderNoSinglePharmacy(true);
      setCurrentView('order_confirmed');
    }
  };

  /**
   * Switches to or runs MediRush Smart Combination (multi-pharmacy parallel optimization)
   */
  const handleRunSmartCombination = async () => {
    setIsOptimizing(true);
    try {
      const pharmacies = await demoPharmacyProvider.getPharmacies();
      const reqMeds = confirmedRequest?.medicines || medicines;
      const reqUrgency = confirmedRequest?.urgency || urgency;

      const comboResult = runSmartFulfilmentEngine(
        {
          medicines: reqMeds.map((m) => ({
            name: m.name,
            quantity: m.quantity || 1,
            unit: m.unit || 'strip',
          })),
          urgency: reqUrgency,
          userLocation: DEMO_USER_LOCATION,
          mode: 'combination',
        },
        pharmacies
      );

      setEngineResult(comboResult);
      setCurrentView('results');
    } catch (err) {
      console.error('Smart combination error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handler: Select Demo Scenario from Landing Page
  const handleSelectSample = (sample: SamplePrescription) => {
    setPrefillSample(sample);
    setMedicines(sample.medicines);
    setUrgency(sample.urgency);
    setIsPrescriptionSource(false);
    setRequestDefaultMode('text');
    setRequestError(null);
    setCurrentView('request');
  };

  const handleResetFlow = () => {
    setPrefillSample(null);
    setRequestError(null);
    setSafetyAlert(undefined);
    setConfirmedRequest(null);
    setEngineResult(null);
    setConfirmedOrder(null);
    setOrderCandidatesChecked([]);
    setOrderNoSinglePharmacy(false);
    setOrderMissingMedicines([]);
    setOrderPipelineActive(false);
    setPrescriptionAnalysis(null);
    setIsPrescriptionSource(false);
    setRequestDefaultMode('text');
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9FF] text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header
        currentView={
          currentView === 'order_summary' || currentView === 'order_confirmed'
            ? 'results'
            : currentView === 'prescription_review'
            ? 'request'
            : currentView
        }
        onNavigate={(view) => {
          if (view === 'home') handleResetFlow();
          else setCurrentView(view);
        }}
        onReset={handleResetFlow}
        userLocationAddress={liveUserLocation?.address}
        onDetectLocation={async () => {
          try {
            sessionStorage.removeItem('medirush_user_real_location');
            const loc = await getUserLocation(8000);
            setLiveUserLocation(loc);
          } catch (_e) {}
        }}
      />

      {/* Main View Router Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {currentView === 'home' && (
          <LandingPage
            onStartOrder={() => {
              setPrefillSample(null);
              setRequestError(null);
              setIsPrescriptionSource(false);
              setRequestDefaultMode('text');
              setCurrentView('request');
            }}
            onUploadPrescription={() => {
              setPrefillSample(null);
              setRequestError(null);
              setIsPrescriptionSource(true);
              setRequestDefaultMode('prescription');
              setCurrentView('request');
            }}
            onSelectSample={handleSelectSample}
          />
        )}

        {currentView === 'request' && (
          <RequestPage
            onAnalyze={handleAnalyzeRequest}
            onAnalyzePrescription={handleAnalyzePrescription}
            isLoading={isAnalyzing}
            prefillSample={prefillSample}
            errorMessage={requestError}
            defaultMode={requestDefaultMode}
          />
        )}

        {currentView === 'understanding' && (
          <UnderstandingPage
            medicines={medicines}
            urgency={urgency}
            userNote={userNote}
            extractionSource={extractionSource}
            safetyAlert={safetyAlert}
            onConfirm={handleExecuteOrderPipeline}
            onBack={() => setCurrentView('request')}
            isOptimizing={isOptimizing || orderPipelineActive}
          />
        )}

        {currentView === 'prescription_review' && prescriptionAnalysis && (
          <PrescriptionReviewPage
            analysisResult={prescriptionAnalysis}
            onConfirmMedicines={handleExecuteOrderPipeline}
            onBackToUpload={() => setCurrentView('request')}
            isOptimizing={isOptimizing || orderPipelineActive}
          />
        )}

        {/* Prompt 6: Final Single-Pharmacy Order Screen */}
        {currentView === 'order_confirmed' && (
          <OrderConfirmedPage
            order={confirmedOrder}
            noPharmacyFound={orderNoSinglePharmacy}
            candidatesChecked={orderCandidatesChecked}
            missingMedicines={orderMissingMedicines}
            onSwitchToCombination={handleRunSmartCombination}
            onNewOrder={handleResetFlow}
          />
        )}

        {/* Existing Combination Mode Results Screen */}
        {currentView === 'results' && engineResult && (
          <ResultsPage
            engineResult={engineResult}
            allPharmacies={allPharmacies}
            userLocation={DEMO_USER_LOCATION}
            urgency={confirmedRequest?.urgency || urgency}
            isPrescriptionSource={isPrescriptionSource}
            onContinueToOrder={() => {
              if (confirmedRequest) {
                handleExecuteOrderPipeline(confirmedRequest);
              } else {
                setCurrentView('order_summary');
              }
            }}
            onModifyRequest={() => {
              if (isPrescriptionSource && prescriptionAnalysis) {
                setCurrentView('prescription_review');
              } else {
                setCurrentView('understanding');
              }
            }}
            onRetryWithAlternativeNetwork={() => setCurrentView('request')}
          />
        )}

        {currentView === 'order_summary' && engineResult?.bestPlan && (
          <OrderSummaryPage
            plan={engineResult.bestPlan}
            urgency={confirmedRequest?.urgency || urgency}
            onBackToResults={() => setCurrentView('results')}
            onNewOrder={handleResetFlow}
          />
        )}
      </main>

      {/* Active Order Pipeline Progress Modal */}
      {orderPipelineActive && (
        <OrderPipelineProgress
          currentStep={orderPipelineStep}
          stepDetails={orderPipelineDetail}
          providerType={orderPipelineProvider}
        />
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
