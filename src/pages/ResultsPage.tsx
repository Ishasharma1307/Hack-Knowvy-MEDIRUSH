import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  Zap, 
  Sparkles, 
  ArrowRight, 
  AlertTriangle, 
  Store, 
  TrendingUp, 
  RotateCcw, 
  Map as MapIcon, 
  XCircle, 
  Package, 
  Clock, 
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Cpu,
  Layers,
  Check,
  Info
} from 'lucide-react';
import { EngineResult, FulfilmentPlan } from '../services/fulfilment/types';
import { Pharmacy, DemoLocation } from '../types/pharmacy';
import { DEMO_USER_LOCATION } from '../services/pharmacy/demoPharmacyProvider';
import { MediMap } from '../components/map/MediMap';
import { generateFulfilmentExplanation, StructuredExplanation } from '../services/gemini/fulfilmentExplanation';

interface ResultsPageProps {
  engineResult: EngineResult;
  allPharmacies: Pharmacy[];
  userLocation?: DemoLocation;
  urgency?: string;
  onContinueToOrder: () => void;
  onModifyRequest: () => void;
  onRetryWithAlternativeNetwork?: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  engineResult,
  allPharmacies,
  userLocation = DEMO_USER_LOCATION,
  urgency = 'urgent',
  onContinueToOrder,
  onModifyRequest,
  onRetryWithAlternativeNetwork,
}) => {
  const [showMap, setShowMap] = useState(true);
  const [showPlansAnalyzed, setShowPlansAnalyzed] = useState(false);
  const [showWhyNotOne, setShowWhyNotOne] = useState(false);

  // Gemini Structured Explanation State
  const [aiExplanation, setAiExplanation] = useState<StructuredExplanation | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const { status, bestPlan, baseline, timeSavedMinutes, speedupPercentage, missingMedicines, whyThisCombination, topPlans } = engineResult;

  // Fetch AI explanation asynchronously from dedicated service
  useEffect(() => {
    if (bestPlan) {
      setIsLoadingAi(true);
      generateFulfilmentExplanation({
        plan: bestPlan,
        baseline,
        urgency,
      })
        .then((explanation) => {
          setAiExplanation(explanation);
        })
        .catch(() => {
          // fallback already handled inside service
        })
        .finally(() => {
          setIsLoadingAi(false);
        });
    }
  }, [bestPlan, baseline, urgency]);

  // Map adapters for Leaflet
  const mapContributions = bestPlan?.pharmacies.map(segment => {
    const rawPharm = allPharmacies.find(p => p.id === segment.pharmacyId);
    return {
      pharmacy: {
        id: segment.pharmacyId,
        name: segment.pharmacyName,
        brand: 'Network Hub',
        address: segment.address,
        lat: segment.latitude,
        lng: segment.longitude,
        distanceKm: segment.distanceKm,
        prepTimeMin: segment.preparationTimeMinutes,
        deliveryTimeMin: segment.deliveryTimeMinutes,
        totalEtaMin: segment.totalTimeMinutes,
        isOpen: true,
        rating: rawPharm?.rating || 4.8,
        phone: rawPharm?.phone || '+91 80 0000 0000',
        tagline: '',
        inventory: [],
      },
      medicinesCovered: segment.allocatedMedicines.map((m, idx) => ({
        id: `med_${idx}`,
        name: m.name,
        quantity: m.quantity,
        unit: m.unit,
        urgency: 'urgent' as const,
      })),
      prepTimeMin: segment.preparationTimeMinutes,
      deliveryTimeMin: segment.deliveryTimeMinutes,
      totalEtaMin: segment.totalTimeMinutes,
      subtotal: 0,
    };
  }) || [];

  const mapPharmacies = allPharmacies.map(p => ({
    id: p.id,
    name: p.name,
    brand: 'Network Partner',
    address: p.address,
    lat: p.latitude,
    lng: p.longitude,
    distanceKm: 1.5,
    prepTimeMin: p.preparationTimeMinutes,
    deliveryTimeMin: p.deliveryTimeMinutes,
    totalEtaMin: p.preparationTimeMinutes + p.deliveryTimeMinutes,
    isOpen: p.open,
    rating: p.rating || 4.8,
    phone: p.phone || '',
    tagline: p.tagline || '',
    inventory: [],
  }));

  // ==========================================
  // 1. NO COMPLETE PLAN SCENARIO
  // ==========================================
  if (status === 'no_complete_plan' || !bestPlan) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-8 animate-fadeIn">
        <div className="bg-white rounded-3xl border border-rose-200 p-6 sm:p-8 shadow-md shadow-rose-500/5 space-y-6">
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Network Stock Constraint
                </span>
                <span className="text-xs text-slate-400">Strict Safety Enforced</span>
              </div>
              <h2 className="text-2xl font-black font-['Outfit'] text-slate-900 mt-0.5">
                Complete fulfilment isn't currently available
              </h2>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            MediRush strictly enforces <strong>100% complete prescription coverage</strong>. Because some requested medicines are not available in sufficient stock across open pharmacies in your area, an incomplete order cannot be dispatched.
          </p>

          {/* Missing Medicines List */}
          <div className="space-y-3 bg-rose-50/70 border border-rose-200 rounded-2xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Missing Medicines Across Local Network:</span>
            </h4>
            <div className="space-y-2">
              {missingMedicines.map((med, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white border border-rose-200 rounded-xl text-xs font-bold text-rose-900 shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-rose-600 font-bold">✕</span>
                    <span>{med}</span>
                  </span>
                  <span className="text-[11px] font-normal text-rose-600">Out of Stock in Local Network</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Notice */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
            <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Medical Safety Rule:</strong> MediRush never makes unauthorized medical substitutions or alters prescribed medications. Please consult your physician or pharmacist for valid alternatives.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onModifyRequest}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Edit Medicine Request</span>
            </button>

            {onRetryWithAlternativeNetwork && (
              <button
                type="button"
                onClick={onRetryWithAlternativeNetwork}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Try Another Pharmacy Network</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. COMPLETE PLAN SUCCESS SCENARIO (HERO SCREEN)
  // ==========================================
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 animate-fadeIn">
      {/* Emergency Safety Alert if emergency urgency */}
      {urgency === 'emergency' && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900 shadow-xs animate-fadeIn">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Emergency note:</strong> MediRush is a delivery optimization service and does not replace emergency medical care. If this is a medical emergency (severe breathlessness, chest pain, uncontrolled bleeding, trauma), contact local emergency services (108 / 112) or seek immediate medical attention.
          </p>
        </div>
      )}

      {/* Top Main Heading & Subheading */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-[#2E7D32] border border-emerald-200 text-xs font-bold tracking-wide shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
          <span>SMART FULFILMENT OPTIMIZATION COMPLETE</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black font-['Outfit'] text-slate-900 tracking-tight">
          Fastest way to fulfil your request
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          MediRush optimized your complete medicine request across nearby pharmacies.
        </p>
      </div>

      {/* Visual Optimization Journey (Prompt 4 Section 3) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1565C0] flex items-center justify-center text-xs font-black">1</span>
            <span>YOUR REQUEST</span>
          </div>
          <span className="text-slate-300 hidden md:inline">→</span>

          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1565C0] flex items-center justify-center text-xs font-black">2</span>
            <span>PHARMACY AVAILABILITY</span>
          </div>
          <span className="text-slate-300 hidden md:inline">→</span>

          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-[#1565C0] flex items-center justify-center text-xs font-black">3</span>
            <span>COMBINATIONS ANALYZED</span>
          </div>
          <span className="text-slate-300 hidden md:inline">→</span>

          <div className="flex items-center gap-2 text-emerald-800 font-extrabold bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
            <span>FASTEST COMPLETE PLAN</span>
          </div>
          <span className="text-slate-300 hidden md:inline">→</span>

          <div className="flex items-center gap-2 text-slate-500 font-semibold">
            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs">5</span>
            <span>READY FOR DELIVERY</span>
          </div>
        </div>
      </div>

      {/* Hero Result Banner (Prompt 4 Section 2) */}
      <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-md shadow-emerald-500/5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2.5 py-0.5 rounded-full">
              FASTEST COMPLETE FULFILMENT
            </span>
            <span className="text-xs text-slate-400">
              Parallel Multi-Hub
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-black font-['Outfit'] text-[#2E7D32]">
              {bestPlan.estimatedCompletionMinutes} min
            </span>
            <span className="text-sm font-semibold text-slate-500">Estimated completion time</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700 pt-1">
            <span className="flex items-center gap-1.5 text-[#2E7D32]">
              <CheckCircle2 className="w-4 h-4" /> {bestPlan.medicinesCoveredCount}/{bestPlan.totalMedicinesRequestedCount} medicines covered
            </span>
            <span className="flex items-center gap-1.5 text-[#1565C0]">
              <Store className="w-4 h-4" /> {bestPlan.pharmacyCount} {bestPlan.pharmacyCount === 1 ? 'pharmacy' : 'pharmacies'}
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-4 h-4" /> {bestPlan.totalDistanceKm} km total pharmacy distance
            </span>
          </div>
        </div>

        {/* Primary CTA: Continue to Order (Prompt 4 Section 13) */}
        <div className="w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={onContinueToOrder}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black text-base shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Continue to Order</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* "Why Not One Pharmacy?" Educational Tooltip / Callout (Prompt 4 Section 12) */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowWhyNotOne(!showWhyNotOne)}>
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#1565C0]">
            <HelpCircle className="w-4 h-4" />
            <span>Why didn't MediRush choose one pharmacy?</span>
          </div>
          <button type="button" className="text-xs text-[#1565C0] font-bold">
            {showWhyNotOne ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        {(showWhyNotOne || true) && (
          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            Because having more medicines in stock does not always mean faster complete fulfilment. MediRush compares complete fulfilment time across available pharmacy combinations.
          </p>
        )}
      </div>

      {/* Selected Pharmacy Allocation Cards (Prompt 4 Section 8) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-['Outfit'] text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-[#1565C0]" />
            <span>Selected Pharmacy Allocations ({bestPlan.pharmacyCount})</span>
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Concurrently Dispatched
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestPlan.pharmacies.map((segment, index) => (
            <div
              key={segment.pharmacyId}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:border-[#1565C0] hover:shadow-md transition-all space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-md bg-blue-100 text-[#1565C0]">
                    PHARMACY {index + 1}
                  </span>
                  <h4 className="text-lg font-bold font-['Outfit'] text-slate-900 mt-1 uppercase">
                    {segment.pharmacyName}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {segment.distanceKm} km away • {segment.address}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-slate-900 font-['Outfit']">
                    ~{segment.totalTimeMinutes} min
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Prep: {segment.preparationTimeMinutes}m | Delivery: {segment.deliveryTimeMinutes}m
                  </div>
                </div>
              </div>

              {/* Fulfilling Items */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#1565C0]" />
                    Fulfilling:
                  </span>
                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded">
                    100% In Stock
                  </span>
                </div>
                <div className="space-y-1">
                  {segment.allocatedMedicines.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                      <Check className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                      <span>{m.name}</span>
                      <span className="text-slate-400 font-normal">({m.quantity} {m.unit})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Together Summary Callout (Prompt 4 Section 8) */}
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center text-xs font-bold text-[#2E7D32]">
          Together, these {bestPlan.pharmacyCount} pharmacies fulfil all {bestPlan.totalMedicinesRequestedCount} medicines.
        </div>
      </div>

      {/* Complete Request Coverage Section (Prompt 4 Section 9) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
          <span>Complete Request Coverage Breakdown</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {bestPlan.allocations.map((alloc, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className="text-[#2E7D32] font-black">✓</span>
                <span>{alloc.medicineName}</span>
                <span className="text-slate-400 font-normal">×{alloc.quantity} {alloc.unit}</span>
              </div>
              <span className="text-[11px] font-extrabold text-[#1565C0] bg-white px-2 py-0.5 rounded border border-slate-200">
                {alloc.pharmacyName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Gemini AI Explanation Section (Prompt 4 Section 5, 6, 7) */}
      <section className="bg-white rounded-3xl border border-blue-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-[#1565C0]">
            <Sparkles className="w-5 h-5 text-[#1565C0]" />
            <h3 className="text-base font-bold font-['Outfit'] text-slate-900">
              Why this combination?
            </h3>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#1565C0] border border-blue-200 px-2 py-0.5 rounded-md">
              AI-assisted explanation
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Gemini understands and explains. MediRush optimizes.
          </span>
        </div>

        {isLoadingAi ? (
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-slate-500 flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-blue-500 animate-spin" />
            <span>Synthesizing natural explanation...</span>
          </div>
        ) : (
          <div className="space-y-3 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
            <p className="text-sm text-slate-800 font-semibold leading-relaxed">
              "{aiExplanation?.summary || whyThisCombination}"
            </p>
            {aiExplanation?.reason && (
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Logistical Rationale:</strong> {aiExplanation.reason}
              </p>
            )}
            {aiExplanation?.timeSavingExplanation && (
              <p className="text-xs text-[#1565C0] font-bold">
                • {aiExplanation.timeSavingExplanation}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Head-to-Head Comparison Card (Prompt 4 Section 10) */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Performance Benchmark
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-['Outfit'] text-white mt-1">
              MediRush vs Single Pharmacy Approach
            </h3>
          </div>
          <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 self-start sm:self-auto">
            *Estimate based on demo pharmacy availability.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Traditional single-pharmacy approach */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Traditional single-pharmacy approach
              </span>
              <span className={`text-xs font-bold ${baseline?.canFulfillAll ? 'text-amber-400' : 'text-rose-400'}`}>
                {baseline?.canFulfillAll ? 'High Delay' : 'Incomplete'}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-['Outfit'] text-slate-300">
              ~{baseline?.estimatedCompletionMinutes || 0} min
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p>Best single pharmacy: <strong className="text-slate-200">{baseline?.pharmacy?.name || 'None'}</strong></p>
              <p>Coverage: {baseline?.medicinesCoveredCount}/{bestPlan.totalMedicinesRequestedCount} medicines in stock</p>
              <p>Distance: {baseline?.distanceKm || 0} km away (Single courier transit queue)</p>
            </div>
          </div>

          {/* MediRush Smart Fulfilment */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                MediRush Smart Fulfilment
              </span>
              <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                Optimized
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-['Outfit'] text-emerald-300">
              ~{bestPlan.estimatedCompletionMinutes} min
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <p>Pharmacy combination: <strong className="text-white">{bestPlan.pharmacyCount} nearby hubs</strong></p>
              <p>Coverage: <strong>100% complete prescription fulfilled</strong></p>
              <p>Combined travel distance: {bestPlan.totalDistanceKm} km total</p>
            </div>
          </div>
        </div>

        {/* Time Saved Callout */}
        <div className="p-4 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-black shrink-0">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="text-sm font-black text-emerald-300 font-['Outfit']">
                {timeSavedMinutes > 0
                  ? `${timeSavedMinutes} min estimated time saved (${speedupPercentage}% faster)`
                  : 'Fastest single-stop route verified'}
              </div>
              <p className="text-xs text-slate-300">
                {timeSavedMinutes > 0
                  ? 'Multi-hub concurrent dispatch eliminates delays from distant warehouse lines.'
                  : 'A single local pharmacy can fulfill 100% of items without extra courier splitting.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* "Plans Analyzed" Collapsible Section (Prompt 4 Section 11) */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowPlansAnalyzed(!showPlansAnalyzed)}
        >
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1565C0]" />
              <h3 className="text-sm font-bold font-['Outfit'] text-slate-900">
                Plans analyzed ({topPlans?.length || 1})
              </h3>
              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Ranked by MediRush Smart Fulfilment Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Proof of optimization: all candidate combinations evaluated by our algorithm.
            </p>
          </div>
          <button type="button" className="p-1 text-slate-400 hover:text-slate-600">
            {showPlansAnalyzed ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showPlansAnalyzed && (
          <div className="space-y-2 pt-2 border-t border-slate-100 animate-fadeIn">
            {(topPlans && topPlans.length > 0 ? topPlans : [bestPlan]).map((planOption, idx) => (
              <div
                key={planOption.planId}
                className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition ${
                  idx === 0 
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 font-bold' 
                    : 'bg-slate-50 border-slate-200/80 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    idx === 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold">
                      {planOption.pharmacies.map(p => p.pharmacyName).join(' + ')}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {planOption.pharmacyCount} {planOption.pharmacyCount === 1 ? 'store' : 'stores'} • {planOption.totalDistanceKm} km total
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-black">~{planOption.estimatedCompletionMinutes} min</div>
                  <div className="text-[10px] text-emerald-700 font-bold">
                    {planOption.medicinesCoveredCount}/{planOption.totalMedicinesRequestedCount} medicines
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* "How MediRush Found the Fastest Plan" (Prompt 4 Section 4) */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold font-['Outfit'] text-slate-900">
          How MediRush found the fastest plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1.5">
            <span className="text-xs font-black text-[#1565C0] font-['Outfit']">01 — Understand</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gemini converts the patient's natural-language request into structured medicine requirements.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1.5">
            <span className="text-xs font-black text-[#1565C0] font-['Outfit']">02 — Analyze</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              MediRush checks available medicine quantities, pharmacy locations and estimated fulfilment times.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1.5">
            <span className="text-xs font-black text-[#1565C0] font-['Outfit']">03 — Optimize</span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our Smart Fulfilment Engine evaluates possible pharmacy combinations and selects the fastest plan that covers the COMPLETE request.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Map Visualizer */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-[#1565C0]" />
            <h3 className="text-base font-bold font-['Outfit'] text-slate-900">
              Geographic Dispatch Network Map
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="text-xs text-[#1565C0] font-bold hover:underline"
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>

        {showMap && (
          <div className="space-y-2">
            <MediMap
              pharmacies={mapPharmacies as any}
              selectedContributions={mapContributions as any}
              patientLocation={{
                lat: userLocation.latitude,
                lng: userLocation.longitude,
                address: userLocation.address,
              }}
              className="h-80 w-full rounded-2xl"
            />
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 px-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#1565C0]"></span> Patient Location
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#2E7D32]"></span> Dispatched Hubs
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-300"></span> Other Network Stores
                </span>
              </div>
              <span>OpenStreetMap & Leaflet</span>
            </div>
          </div>
        )}
      </section>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onModifyRequest}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <span>Modify Prescription</span>
        </button>

        <button
          type="button"
          onClick={onContinueToOrder}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black text-base shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <span>Continue to Order</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
