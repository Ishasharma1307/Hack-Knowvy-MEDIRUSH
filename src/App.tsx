import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { RequestPage } from './pages/RequestPage';
import { UnderstandingPage } from './pages/UnderstandingPage';
import { ResultsPage } from './pages/ResultsPage';
import { TrackingPage } from './pages/TrackingPage';

import { 
  MedicineItem, 
  UrgencyLevel, 
  SamplePrescription, 
  StructuredMedicineRequest 
} from './types';
import { Pharmacy, DemoLocation } from './types/pharmacy';
import { demoPharmacyProvider, DEMO_USER_LOCATION } from './services/pharmacy/demoPharmacyProvider';
import { extractMedicinesWithAI } from './services/ai/geminiService';
import { runSmartFulfilmentEngine } from './services/fulfilment/smartFulfilmentEngine';
import { EngineResult } from './services/fulfilment/types';
import { persistOrderRequest } from './services/supabase/client';

export const App: React.FC = () => {
  // Navigation View State
  const [currentView, setCurrentView] = useState<'home' | 'request' | 'understanding' | 'results' | 'tracking'>('home');

  // Domain Data State
  const [allPharmacies, setAllPharmacies] = useState<Pharmacy[]>([]);
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [urgency, setUrgency] = useState<UrgencyLevel>('urgent');
  const [userNote, setUserNote] = useState<string>('');
  const [extractionSource, setExtractionSource] = useState<'gemini' | 'fallback' | 'demo'>('gemini');
  const [safetyAlert, setSafetyAlert] = useState<string | undefined>(undefined);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [prefillSample, setPrefillSample] = useState<SamplePrescription | null>(null);

  // Engine Optimization Result State
  const [confirmedRequest, setConfirmedRequest] = useState<StructuredMedicineRequest | null>(null);
  const [engineResult, setEngineResult] = useState<EngineResult | null>(null);
  const [orderId, setOrderId] = useState<string>('');

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

  // Handler: User Confirms Medicines -> Run Smart Fulfilment Engine
  const handleConfirmAndOptimize = async (structuredReq: StructuredMedicineRequest) => {
    setIsOptimizing(true);
    setConfirmedRequest(structuredReq);

    try {
      // Ensure latest pharmacies are loaded from provider
      const pharmacies = await demoPharmacyProvider.getPharmacies();
      setAllPharmacies(pharmacies);

      // Run deterministic Smart Fulfilment Engine
      const result = runSmartFulfilmentEngine(
        {
          medicines: structuredReq.medicines,
          urgency: structuredReq.urgency,
          userLocation: DEMO_USER_LOCATION,
        },
        pharmacies
      );

      console.log('[MediRush Engine] Optimization Complete:', result);

      setEngineResult(result);
      setCurrentView('results');
    } catch (err) {
      console.error('Optimization engine error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handler: Place Order & Dispatch Couriers
  const handlePlaceOrder = async () => {
    if (!engineResult || !engineResult.bestPlan) return;
    const legacyPlan = {
      planId: engineResult.bestPlan.planId,
      selectedPharmacies: engineResult.bestPlan.pharmacies.map(p => ({
        pharmacy: {
          id: p.pharmacyId,
          name: p.pharmacyName,
          brand: 'Network Partner',
          address: p.address,
          lat: p.latitude,
          lng: p.longitude,
          distanceKm: p.distanceKm,
          prepTimeMin: p.preparationTimeMinutes,
          deliveryTimeMin: p.deliveryTimeMinutes,
          totalEtaMin: p.totalTimeMinutes,
          isOpen: true,
          rating: 4.8,
          phone: '+91 80 0000 0000',
          tagline: '',
          inventory: [],
        },
        medicinesCovered: p.allocatedMedicines.map((m, i) => ({
          id: `m_${i}`,
          name: m.name,
          quantity: m.quantity,
          unit: m.unit,
          urgency: 'urgent' as const,
        })),
        prepTimeMin: p.preparationTimeMinutes,
        deliveryTimeMin: p.deliveryTimeMinutes,
        totalEtaMin: p.totalTimeMinutes,
        subtotal: 0,
      })),
      allCovered: true,
      coveredMedicines: medicines,
      uncoveredMedicines: [],
      estimatedTotalTimeMin: engineResult.bestPlan.estimatedCompletionMinutes,
      totalDistanceKm: engineResult.bestPlan.totalDistanceKm,
      totalCost: 350,
      pharmacyCount: engineResult.bestPlan.pharmacyCount,
      efficiencyScore: 98,
    };

    const { orderId: newOrderId } = await persistOrderRequest(medicines, legacyPlan as any);
    setOrderId(newOrderId);
    setCurrentView('tracking');
  };

  // Handler: Select Demo Scenario from Landing Page
  const handleSelectSample = (sample: SamplePrescription) => {
    setPrefillSample(sample);
    setMedicines(sample.medicines);
    setUrgency(sample.urgency);
    setRequestError(null);
    setCurrentView('request');
  };

  const handleResetFlow = () => {
    setPrefillSample(null);
    setRequestError(null);
    setSafetyAlert(undefined);
    setConfirmedRequest(null);
    setEngineResult(null);
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F9FF] text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Application Header */}
      <Header
        currentView={currentView}
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
              setCurrentView('request');
            }}
            onSelectSample={handleSelectSample}
          />
        )}

        {currentView === 'request' && (
          <RequestPage
            onAnalyze={handleAnalyzeRequest}
            isLoading={isAnalyzing}
            prefillSample={prefillSample}
            errorMessage={requestError}
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

        {currentView === 'results' && engineResult && (
          <ResultsPage
            engineResult={engineResult}
            allPharmacies={allPharmacies}
            userLocation={DEMO_USER_LOCATION}
            onPlaceOrder={handlePlaceOrder}
            onModifyRequest={() => setCurrentView('understanding')}
            onRetryWithAlternativeNetwork={() => setCurrentView('request')}
          />
        )}

        {currentView === 'tracking' && engineResult?.bestPlan && (
          <TrackingPage
            orderId={orderId || 'MDR-948210'}
            plan={engineResult.bestPlan}
            medicines={medicines}
            onNewOrder={() => {
              handleResetFlow();
              setCurrentView('request');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
