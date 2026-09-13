import React, { useState } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { EngineResult, FulfilmentPlan, SinglePharmacyBaseline } from '../services/fulfilment/types';
import { Pharmacy, DemoLocation } from '../types/pharmacy';
import { DEMO_USER_LOCATION } from '../services/pharmacy/demoPharmacyProvider';
import { MediMap } from '../components/map/MediMap';
import confetti from 'canvas-confetti';

interface ResultsPageProps {
  engineResult: EngineResult;
  allPharmacies: Pharmacy[];
  userLocation?: DemoLocation;
  onPlaceOrder: () => void;
  onModifyRequest: () => void;
  onRetryWithAlternativeNetwork?: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  engineResult,
  allPharmacies,
  userLocation = DEMO_USER_LOCATION,
  onPlaceOrder,
  onModifyRequest,
  onRetryWithAlternativeNetwork,
}) => {
  const [showMap, setShowMap] = useState(true);

  const { status, bestPlan, baseline, timeSavedMinutes, speedupPercentage, missingMedicines, whyThisCombination } = engineResult;

  // Handler for order dispatch
  const handleOrderClick = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1565C0', '#2E7D32', '#64B5F6', '#81C784'],
      });
    } catch (e) {
      // ignore
    }
    onPlaceOrder();
  };

  // Convert pharmacy segments to MediMap's expected prop format
  const mapContributions = bestPlan?.pharmacies.map(segment => {
    const rawPharm = allPharmacies.find(p => p.id === segment.pharmacyId);
    return {
      pharmacy: {
        id: segment.pharmacyId,
        name: segment.pharmacyName,
        brand: 'Network Partner',
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
        tagline: rawPharm?.tagline || 'Dispatched Store Hub',
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
        {/* Incomplete Banner */}
        <div className="bg-white rounded-3xl border border-rose-200 p-6 sm:p-8 shadow-md shadow-rose-500/5 space-y-6">
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Network Coverage Constraint
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
                    <span className="text-rose-600">✕</span>
                    <span>{med}</span>
                  </span>
                  <span className="text-[11px] font-normal text-rose-600">Out of Stock Locally</span>
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

      {/* Hero Result Banner */}
      <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-md shadow-emerald-500/5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Optimal Estimated Completion
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
              Parallel Dispatch
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-black font-['Outfit'] text-[#2E7D32]">
              {bestPlan.estimatedCompletionMinutes} min
            </span>
            <span className="text-sm font-semibold text-slate-500">Estimated completion</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700 pt-1">
            <span className="flex items-center gap-1.5 text-[#2E7D32]">
              <CheckCircle2 className="w-4 h-4" /> {bestPlan.medicinesCoveredCount}/{bestPlan.totalMedicinesRequestedCount} medicines covered
            </span>
            <span className="flex items-center gap-1.5 text-[#1565C0]">
              <Store className="w-4 h-4" /> {bestPlan.pharmacyCount} {bestPlan.pharmacyCount === 1 ? 'pharmacy' : 'pharmacies'}
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-4 h-4" /> {bestPlan.totalDistanceKm} km combined distance
            </span>
          </div>
        </div>

        {/* Action Button on Hero */}
        <div className="w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleOrderClick}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black text-base shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Confirm & Dispatch</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Selected Pharmacy Plan Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold font-['Outfit'] text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-[#1565C0]" />
            <span>Selected Pharmacy Plan ({bestPlan.pharmacyCount})</span>
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            Concurrent Preparation & Delivery
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
                  <h4 className="text-lg font-bold font-['Outfit'] text-slate-900 mt-1">
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

              {/* Preparing List */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#1565C0]" />
                    Preparing ({segment.allocatedMedicines.length} medicines):
                  </span>
                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded">
                    In Stock
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {segment.allocatedMedicines.map((m, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-white text-slate-800 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      {m.name} <span className="text-slate-400 font-normal">×{m.quantity} {m.unit}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Together Summary Callout */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center text-xs font-bold text-[#2E7D32]">
          Together, these {bestPlan.pharmacyCount} pharmacies fulfil all {bestPlan.totalMedicinesRequestedCount} requested medicines.
        </div>
      </div>

      {/* Why This Combination Section */}
      <section className="bg-white rounded-3xl border border-blue-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-[#1565C0]">
          <Sparkles className="w-5 h-5 text-[#1565C0]" />
          <h3 className="text-base font-bold font-['Outfit'] text-slate-900">
            Why this combination?
          </h3>
          <span className="text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#1565C0] px-2 py-0.5 rounded-md">
            MediRush Algorithm Rationale
          </span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/60 p-4 rounded-2xl border border-blue-100 font-medium">
          "{whyThisCombination}"
        </p>
      </section>

      {/* Head-to-Head Comparison Card (Prompt 3 requirement #18) */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Baseline Benchmark
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-['Outfit'] text-white mt-1">
              MediRush vs Single Pharmacy Approach
            </h3>
          </div>
          <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 self-start sm:self-auto">
            *Based on demo pharmacy availability and estimated fulfilment times.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* WITHOUT OPTIMIZATION */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Without Optimization
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
              <p>Distance: {baseline?.distanceKm || 0} km away (Single courier queue)</p>
            </div>
          </div>

          {/* WITH MEDIRUSH */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                With MediRush
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
              <p>Coverage: <strong>100% full prescription fulfilled</strong></p>
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
                  ? `Estimated time saved: ~${timeSavedMinutes} minutes (${speedupPercentage}% faster)`
                  : 'Fastest single-stop route verified'}
              </div>
              <p className="text-xs text-slate-300">
                {timeSavedMinutes > 0
                  ? 'Multi-hub concurrent dispatch eliminates delays from long-distance single warehouse queues.'
                  : 'A single local pharmacy can fulfill 100% of items without extra courier splitting.'}
              </p>
            </div>
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

      {/* Bottom Navigation */}
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
          onClick={handleOrderClick}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black text-base shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <span>Confirm & Dispatch Couriers</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
