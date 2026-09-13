import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  Store, 
  Package, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  RotateCcw,
  Bike
} from 'lucide-react';
import { Order, PharmacyCandidateEvaluation } from '../types/order';
import confetti from 'canvas-confetti';

export interface OrderConfirmedPageProps {
  order: Order | null;
  noPharmacyFound?: boolean;
  candidatesChecked: PharmacyCandidateEvaluation[];
  missingMedicines?: string[];
  onSwitchToCombination: () => void;
  onNewOrder: () => void;
}

export const OrderConfirmedPage: React.FC<OrderConfirmedPageProps> = ({
  order,
  noPharmacyFound = false,
  candidatesChecked,
  missingMedicines = [],
  onSwitchToCombination,
  onNewOrder,
}) => {
  const [showCandidatesList, setShowCandidatesList] = useState(true);

  // Trigger celebration on initial mount if order is confirmed
  useEffect(() => {
    if (order) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1565C0', '#2E7D32', '#43A047', '#1E88E5'],
        });
      } catch (_e) {
        // ignore
      }
    }
  }, [order]);

  // ─── CASE A: NO SINGLE PHARMACY CAN FULFIL THE COMPLETE REQUEST (Section 28) ───
  if (noPharmacyFound || !order) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-6 animate-fadeIn">
        <div className="bg-white rounded-3xl border border-amber-300 p-6 sm:p-8 shadow-xl shadow-amber-500/5 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                Single Store Limit Reached
              </span>
              <h2 className="text-2xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight">
                None of the nearby pharmacies can currently fulfil your complete request.
              </h2>
              <p className="text-xs text-slate-500">
                Checked top {candidatesChecked.length || 5} nearby candidate pharmacies, but no single store has 100% of your medicines in stock.
              </p>
            </div>
          </div>

          {/* Missing Medicines Pill List */}
          {missingMedicines.length > 0 && (
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
              <span className="text-xs font-bold text-amber-900 block">
                Missing / Out-of-Stock Medicines across nearby stores:
              </span>
              <div className="flex flex-wrap gap-2">
                {missingMedicines.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white rounded-full text-xs font-bold text-amber-800 border border-amber-200"
                  >
                    ✕ {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Collapsible Checked Candidates List */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
            <div
              onClick={() => setShowCandidatesList(!showCandidatesList)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">
                  Pharmacies checked ({candidatesChecked.length} stores)
                </span>
              </div>
              {showCandidatesList ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </div>

            {showCandidatesList && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                {candidatesChecked.map((cand, idx) => (
                  <div
                    key={cand.candidateId || cand.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">
                        {idx + 1}. {cand.candidateName || cand.name}
                      </span>
                      <span className="text-slate-500 ml-2">
                        • {cand.distanceKm} km away
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600">
                        {cand.medicinesAvailableCount}/{cand.totalMedicinesRequestedCount} medicines
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
                        Not eligible
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Primary Resolution CTA: Smart Combination */}
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1565C0]">
              <Sparkles className="w-4 h-4" />
              <span>MediRush Multi-Pharmacy Smart Fulfilment</span>
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 font-['Outfit']">
                Fulfill 100% of your prescription with Smart Combination
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                MediRush can split your order across 2 nearby pharmacies dispatched simultaneously to deliver all medicines in under 20 minutes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={onSwitchToCombination}
                className="px-6 py-3.5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Use Smart Combination</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onNewOrder}
                className="px-5 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Start New Search</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── CASE B: SUCCESSFUL SINGLE PHARMACY ORDER CONFIRMED (Section 19, 20, 21) ───
  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 space-y-6 animate-fadeIn">
      {/* Confirmation Hero Card */}
      <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-xl shadow-emerald-500/5 space-y-6">
        {/* Top Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-1">
                <span>✓ Order confirmed</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight">
                Order placed with {order.pharmacyName}
              </h1>
            </div>
          </div>

          <div className="sm:text-right bg-slate-50 p-3 sm:p-0 sm:bg-transparent rounded-xl border sm:border-0 border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              Order Reference
            </span>
            <span className="text-base font-black font-mono text-slate-800">
              {order.orderNumber}
            </span>
            <span className="text-[10px] text-slate-400 block">
              Source: {order.source === 'prescription' ? 'Prescription Upload' : 'Manual Request'}
            </span>
          </div>
        </div>

        {/* 4 Core Calculated Value Metrics (Section 19) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold mb-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Distance</span>
            </div>
            <span className="text-2xl font-black font-['Outfit'] text-slate-900 block">
              {order.pharmacyDistanceKm} <span className="text-sm font-semibold text-slate-500">km</span>
            </span>
            <span className="text-[10px] text-slate-400">from your location</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold mb-1">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span>Medicines</span>
            </div>
            <span className="text-2xl font-black font-['Outfit'] text-emerald-700 block">
              {order.medicinesCovered}/{order.totalMedicines}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">100% available</span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Prep Time</span>
            </div>
            <span className="text-2xl font-black font-['Outfit'] text-slate-900 block">
              {order.estimatedPreparationMinutes} <span className="text-sm font-semibold text-slate-500">min</span>
            </span>
            <span className="text-[10px] text-slate-400">dispense & pack</span>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200">
            <div className="flex items-center gap-1.5 text-blue-700 text-[11px] font-bold mb-1">
              <Bike className="w-3.5 h-3.5 text-[#1565C0]" />
              <span>Total ETA</span>
            </div>
            <span className="text-2xl font-black font-['Outfit'] text-[#1565C0] block">
              ~{order.estimatedFulfilmentMinutes} <span className="text-sm font-semibold text-blue-500">min</span>
            </span>
            <span className="text-[10px] text-blue-600 font-bold">Estimated completion</span>
          </div>
        </div>

        {/* Section 20: "Why this pharmacy?" Box */}
        <div className="p-5 bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/60 rounded-2xl border border-blue-200/80 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#1565C0]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#1565C0]">
              Why this pharmacy?
            </span>
          </div>
          <p className="text-sm font-medium text-slate-700 leading-relaxed">
            {order.whyThisPharmacy}
          </p>
        </div>

        {/* Section 21: Collapsible "Pharmacies checked" Comparison List */}
        <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 bg-slate-50/60">
          <div
            onClick={() => setShowCandidatesList(!showCandidatesList)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-slate-700" />
              <div>
                <span className="text-xs font-extrabold text-slate-900 block font-['Outfit']">
                  Pharmacies checked ({candidatesChecked.length} candidate stores)
                </span>
                <span className="text-[11px] text-slate-500">
                  Nearest candidate stores discovered by Gemini / Google Maps
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-[#1565C0]">
              <span>{showCandidatesList ? 'Hide details' : 'Show details'}</span>
              {showCandidatesList ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>

          {showCandidatesList && (
            <div className="space-y-2.5 pt-2 border-t border-slate-200">
              {candidatesChecked.map((cand, idx) => {
                const isSelected = cand.status === 'SELECTED';
                const isEligible = cand.status === 'Eligible';
                const isNotEligible = cand.status === 'Not eligible';

                return (
                  <div
                    key={cand.candidateId || cand.id || idx}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border text-xs gap-2 transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                        : isEligible
                        ? 'bg-blue-50/40 border-blue-200'
                        : 'bg-white border-slate-200 opacity-75'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">
                          {idx + 1}. {cand.candidateName || cand.name}
                        </span>
                        <span className="font-semibold text-slate-500">
                          ({cand.distanceKm} km)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate max-w-sm">
                        {cand.address}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                      <span className="font-semibold text-slate-700">
                        {cand.medicinesAvailableCount}/{cand.totalMedicinesRequestedCount} medicines
                      </span>

                      {isSelected && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                          ✓ SELECTED
                        </span>
                      )}

                      {isEligible && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                          Eligible
                        </span>
                      )}

                      {isNotEligible && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                          Not eligible
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Medicines in Order */}
        <div className="border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3 bg-white">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5 font-['Outfit']">
              <Package className="w-4 h-4 text-emerald-600" />
              Prescription Items in Order ({order.items.length})
            </span>
            <span className="text-[11px] text-emerald-600 font-extrabold uppercase">
              All Items Confirmed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {order.items.map((item: any, idx: number) => (
              <div
                key={item.id || idx}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{item.medicineName}</span>
                  {item.strength && (
                    <span className="text-[10px] text-slate-500">{item.strength}</span>
                  )}
                </div>
                <span className="font-bold text-slate-700 px-2 py-0.5 bg-white rounded border border-slate-200 text-[11px]">
                  {item.quantity} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Comparison / Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onNewOrder}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Place Another Order</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToCombination}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#1565C0]" />
            <span>Compare with Smart Combination (Multi-Pharmacy Split)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
