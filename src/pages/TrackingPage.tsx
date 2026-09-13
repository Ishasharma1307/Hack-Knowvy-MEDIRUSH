import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Bike, 
  Phone, 
  Zap, 
  ArrowLeft,
  Package
} from 'lucide-react';
import { FulfilmentPlan as EngineFulfilmentPlan } from '../services/fulfilment/types';
import { MedicineItem } from '../types';
import { DEMO_USER_LOCATION } from '../services/pharmacy/demoPharmacyProvider';

interface TrackingPageProps {
  orderId: string;
  plan: EngineFulfilmentPlan | any;
  medicines: MedicineItem[];
  onNewOrder: () => void;
}

export const TrackingPage: React.FC<TrackingPageProps> = ({
  orderId,
  plan,
  medicines,
  onNewOrder,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalEta = plan?.estimatedCompletionMinutes || plan?.estimatedTotalTimeMin || 15;
  const minutesRemaining = Math.max(1, totalEta - Math.floor(secondsElapsed / 4));

  // Extract segments whether from new engine or legacy format
  const segments = plan?.pharmacies || plan?.selectedPharmacies || [];

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-emerald-200/90 p-6 sm:p-8 shadow-md shadow-emerald-500/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Order Placed #{orderId}
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  DISPATCHED
                </span>
              </div>
              <h2 className="text-2xl font-black font-['Outfit'] text-slate-900">
                Parallel Delivery in Progress
              </h2>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-5 py-2.5 rounded-2xl text-center sm:text-right">
            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Simulated Arrival
            </div>
            <div className="text-2xl font-black text-[#2E7D32] font-['Outfit']">
              ~{minutesRemaining} min
            </div>
          </div>
        </div>

        {/* Multi-step progress timeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Progress Status</span>
            <span className="text-[#1565C0] font-black">Stage 3 of 4: Couriers En Route</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
            <div className="bg-[#2E7D32] h-full w-3/4 rounded-full transition-all duration-500 animate-pulse" />
          </div>
          <div className="grid grid-cols-4 text-center text-[10px] text-slate-400 font-semibold pt-1">
            <span className="text-emerald-700 font-bold">Optimized ✓</span>
            <span className="text-emerald-700 font-bold">Packed ✓</span>
            <span className="text-blue-600 font-bold">In Transit •</span>
            <span>Delivered</span>
          </div>
        </div>
      </div>

      {/* Parallel Couriers Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold font-['Outfit'] text-slate-900 flex items-center gap-2">
          <Bike className="w-5 h-5 text-[#1565C0]" />
          <span>Active Dispatches ({segments.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segments.map((item: any, idx: number) => {
            const name = item.pharmacyName || item.pharmacy?.name || `Hub ${idx + 1}`;
            const address = item.address || item.pharmacy?.address || 'Indiranagar Hub';
            const dist = item.distanceKm || item.pharmacy?.distanceKm || 1.5;
            const eta = item.totalTimeMinutes || item.totalEtaMin || 12;
            const meds = item.allocatedMedicines || item.medicinesCovered || [];

            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-[#1565C0] uppercase">
                      Courier {idx + 1}
                    </span>
                    <h4 className="text-base font-bold font-['Outfit'] text-slate-900 mt-1">
                      {name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {dist} km away • {address}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                      ETA ~{eta}m
                    </span>
                  </div>
                </div>

                {/* Medicines in this courier package */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#1565C0]" />
                    <span>Prescription Medicines Delivered:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {meds.map((m: any, mIdx: number) => (
                      <span
                        key={mIdx}
                        className="text-xs bg-white text-slate-800 font-medium px-2 py-0.5 rounded-md border border-slate-200"
                      >
                        {m.name} (×{m.quantity} {m.unit || 'strip'})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Courier contact */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Rider: Dedicated Express Partner</span>
                  <span className="text-[#1565C0] font-semibold flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Call Driver
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Patient Delivery Address Details */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h4 className="text-sm font-bold font-['Outfit'] text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#1565C0]" />
          <span>Delivery Destination</span>
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          {DEMO_USER_LOCATION.address}
        </p>
        <div className="text-[11px] text-slate-400">
          Geocoded coordinates: {DEMO_USER_LOCATION.latitude}, {DEMO_USER_LOCATION.longitude}
        </div>
      </div>

      {/* Return to order CTA */}
      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={onNewOrder}
          className="px-8 py-4 rounded-2xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Place Another Medicine Request</span>
        </button>
      </div>
    </div>
  );
};
