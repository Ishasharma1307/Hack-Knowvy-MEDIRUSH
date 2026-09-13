import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { RequestPage } from './pages/RequestPage';
import { UnderstandingPage } from './pages/UnderstandingPage';
import { ResultsPage } from './pages/ResultsPage';
import { OrderSummaryPage } from './pages/OrderSummaryPage';
import { PrescriptionReviewPage } from './pages/PrescriptionReviewPage';

import { 
  MedicineItem, 
  UrgencyLevel, 
  SamplePrescription, 
  StructuredMedicineRequest 
} from './types';
import { Pharmacy, DemoLocation } from './types/pharmacy';
import { demoPharmacyProvider, DEMO_USER_LOCATION } from './services/pharmacy/demoPharmacyProvider';
import { extractMedicinesWithAI } from './services/ai/geminiService';
import { analyzePrescriptionWithGemini, PrescriptionAnalysisResult } from './services/gemini/prescriptionAnalyzer';
import { runSmartFulfilmentEngine } from './services/fulfilment/smartFulfilmentEngine';
import { EngineResult } from './services/fulfilment/types';

export const App: React.FC = () => {
  // Navigation View State
  const [currentView, setCurrentView] = useState<'home' | 'request' | 'understanding' | 'prescription_review' | 'results' | 'order_summary'>('home');
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

  // Loading States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Initialize Pharmacies from Demo Provider
  useEffect(() => {
    async function loadPharmacies() {
      const stores = await demoPharmacyProvider.getPharmacies();
      setAllPharmacies(stores);
    }
    loadPharmacies();
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

      // Show any Gemini warning (e.g. fallback mode) as a non-blocking notice
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

  // Handler: User Confirms Medicines -> Run Smart Fulfilment Engine with smooth loading state
  const handleConfirmAndOptimize = async (structuredReq: StructuredMedicineRequest) => {
    setIsOptimizing(true);
    setConfirmedRequest(structuredReq);

    try {
      // 1. Ensure latest pharmacies are loaded from provider
      const pharmacies = await demoPharmacyProvider.getPharmacies();
      setAllPharmacies(pharmacies);

      // 2. Allow 1 second for the 4-step loading state to animate smoothly
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Run deterministic Smart Fulfilment Engine
      const result = runSmartFulfilmentEngine(
        {
          medicines: structuredReq.medicines,
          urgency: structuredReq.urgency,
          userLocation: DEMO_USER_LOCATION,
        },
        pharmacies
      );

      console.log('[MediRush Engine] Optimization Result:', result);

      setEngineResult(result);
      setCurrentView('results');
    } catch (err) {
      console.error('Optimization engine error:', err);
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
    setPrescriptionAnalysis(null);
    setIsPrescriptionSource(false);
    setRequestDefaultMode('text');
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9FF] text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header
        currentView={currentView === 'order_summary' ? 'results' : currentView === 'prescription_review' ? 'request' : currentView}
        onNavigate={(view) => {
          if (view === 'home') handleResetFlow();
          else setCurrentView(view);
        }}
        onReset={handleResetFlow}
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
            onConfirm={handleConfirmAndOptimize}
            onBack={() => setCurrentView('request')}
            isOptimizing={isOptimizing}
          />
        )}

        {currentView === 'prescription_review' && prescriptionAnalysis && (
          <PrescriptionReviewPage
            analysisResult={prescriptionAnalysis}
            onConfirmMedicines={handleConfirmAndOptimize}
            onBackToUpload={() => setCurrentView('request')}
            isOptimizing={isOptimizing}
          />
        )}

        {currentView === 'results' && engineResult && (
          <ResultsPage
            engineResult={engineResult}
            allPharmacies={allPharmacies}
            userLocation={DEMO_USER_LOCATION}
            urgency={confirmedRequest?.urgency || urgency}
            isPrescriptionSource={isPrescriptionSource}
            onContinueToOrder={() => setCurrentView('order_summary')}
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

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
