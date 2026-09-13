import React, { useState } from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  Store, 
  Package, 
  ArrowLeft, 
  Zap, 
  ShieldCheck, 
  Clock, 
  RotateCcw,
  Bike
} from 'lucide-react';
import { FulfilmentPlan } from '../services/fulfilment/types';
import { DEMO_USER_LOCATION } from '../services/pharmacy/demoPharmacyProvider';
import confetti from 'canvas-confetti';

interface OrderSummaryPageProps {
  plan: FulfilmentPlan;
  urgency: string;
  onBackToResults: () => void;
  onNewOrder: () => void;
}

export const OrderSummaryPage: React.FC<OrderSummaryPageProps> = ({
  plan,
  urgency,
  onBackToResults,
  onNewOrder,
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [orderId, setOrderId] = useState('');

  const handleConfirmOrder = () => {
    const id = `MDR-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(id);
    setIsConfirmed(true);

    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#1565C0', '#2E7D32', '#64B5F6', '#81C784'],
      });
    } catch (e) {
      // ignore
    }
  };

  // State 2: Request Confirmed Screen (Prompt 4 Section 14)
  if (isConfirmed) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-8 animate-fadeIn">
        <div className="bg-white rounded-3xl border border-emerald-200/90 p-6 sm:p-10 shadow-xl shadow-emerald-500/5 space-y-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center font-black mx-auto shadow-lg shadow-emerald-600/30">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Order #{orderId}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black font-['Outfit'] text-slate-900 tracking-tight">
              Your MediRush request is confirmed
            </h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Dispatches have been queued across our local pharmacy network for concurrent preparation.
            </p>
          </div>

          {/* Verification steps confirmed */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3 text-left">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-800">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] shrink-0">✓</span>
              <span>Complete medicine request identified ({plan.totalMedicinesRequestedCount} items)</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-800">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] shrink-0">✓</span>
              <span>Pharmacy allocation created ({plan.pharmacyCount} partner hubs)</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-800">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] shrink-0">✓</span>
              <span>Fulfilment plan optimized for fastest parallel delivery</span>
            </div>
          </div>

          {/* Prominent ETA Callout */}
          <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-3xl space-y-1">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Estimated Completion Time
            </div>
            <div className="text-4xl sm:text-5xl font-black font-['Outfit'] text-[#2E7D32]">
              {plan.estimatedCompletionMinutes} min
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Parallel dispatch from {plan.pharmacies.map(p => p.pharmacyName).join(' & ')}
            </p>
          </div>

          {/* Transparent Live Partner Tracking Disclaimer */}
          <div className="p-4 bg-slate-100/90 rounded-2xl border border-slate-200/80 text-xs text-slate-500 flex items-start gap-2.5 text-left">
            <Bike className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Notice:</strong> Tracking will be available once connected to live pharmacy partners. In production, driver GPS telemetry updates in real-time.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onNewOrder}
              className="w-full py-4 rounded-2xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Place Another Medicine Request</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 1: Order Summary Preview (Prompt 4 Section 13)
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 text-[#1565C0] text-xs font-bold border border-blue-200">
          <Package className="w-3.5 h-3.5" />
          <span>Final Dispatch Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-['Outfit'] text-slate-900">
          Prescription Order Summary
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Review the allocated pharmacies and estimated delivery schedule before finalizing dispatch.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl shadow-blue-500/5 space-y-6">
        {/* Top Summary Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Fulfillment Method
            </div>
            <div className="text-lg font-black font-['Outfit'] text-slate-900 mt-0.5">
              MediRush Parallel Hub Dispatch
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {plan.totalMedicinesRequestedCount} medicines • {plan.pharmacyCount} pharmacies • {urgency} priority
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-5 py-2.5 rounded-2xl text-center sm:text-right">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Total Arrival Time
            </div>
            <div className="text-2xl font-black text-[#2E7D32] font-['Outfit']">
              ~{plan.estimatedCompletionMinutes} min
            </div>
          </div>
        </div>

        {/* Pharmacy Allocations */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Selected Pharmacy Dispatches:
          </h3>
          <div className="space-y-3">
            {plan.pharmacies.map((pharm, i) => (
              <div
                key={pharm.pharmacyId}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#1565C0] bg-blue-100 px-2 py-0.5 rounded-md">
                      Hub {i + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{pharm.pharmacyName}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {pharm.distanceKm} km away • {pharm.address}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {pharm.allocatedMedicines.map((m, mIdx) => (
                      <span
                        key={mIdx}
                        className="text-[11px] bg-white text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200"
                      >
                        {m.name} ×{m.quantity} {m.unit}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right sm:self-center shrink-0">
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    ETA ~{pharm.totalTimeMinutes}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Patient Delivery Address */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
          <div className="font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#1565C0]" />
            <span>Delivery Destination</span>
          </div>
          <p className="text-slate-600">{DEMO_USER_LOCATION.address}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onBackToResults}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Results</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmOrder}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black text-base shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirm & Dispatch Request</span>
          </button>
        </div>
      </div>
    </div>
  );
};
