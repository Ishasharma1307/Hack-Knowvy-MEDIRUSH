import React from 'react';
import { 
  Zap, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Cpu, 
  Store, 
  Sparkles,
  Layers,
  Flame,
  Check
} from 'lucide-react';
import { SAMPLE_PRESCRIPTIONS } from '../data/samplePrescriptions';
import { SamplePrescription } from '../types';

interface LandingPageProps {
  onStartOrder: () => void;
  onSelectSample: (sample: SamplePrescription) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartOrder, onSelectSample }) => {
  return (
    <div className="space-y-16 py-6 animate-fadeIn">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-white/80 to-blue-50/60 border border-blue-100/80 p-8 sm:p-12 lg:p-16 shadow-xl shadow-blue-500/5">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#1565C0] text-xs font-bold tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#1565C0]" />
            <span>Smart Combinatorial Prescription Fulfilment</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08] font-['Outfit']">
            Your medicines. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1565C0] via-[#1E88E5] to-[#0D47A1]">
              The fastest way
            </span>{' '}
            to get them.
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            One prescription can mean multiple pharmacies. MediRush finds the 
            <span className="font-semibold text-slate-900"> fastest combination </span>
            to fulfil your complete request without waiting or calling stores.
          </p>

          {/* CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartOrder}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-base shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>Order Medicines</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={() => onSelectSample(SAMPLE_PRESCRIPTIONS[0])}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-base border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Try 5-Medicine Demo Scenario</span>
            </button>
          </div>

          {/* Trust points */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
              <span>100% Prescription Coverage Guaranteed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1565C0]" />
              <span>Parallel Multi-Store Dispatch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Gemini Clinical Understanding</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Pipeline Flow: Patient -> Gemini AI -> Pharmacy Network -> Parallel Dispatch */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-slate-900">
            How MediRush Outperforms Single Stores
          </h2>
          <p className="text-sm text-slate-500">
            Traditional medicine delivery is constrained by a single store's inventory. MediRush dispatches in parallel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative group hover:border-blue-300 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold text-lg mb-4 border border-blue-100">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1 font-['Outfit']">Prescription Input</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Patient enters natural text or prescription list with multiple complex medications and dosage rules.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative group hover:border-blue-300 transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg mb-4 border border-purple-100">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1 font-['Outfit']">Gemini Understanding</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Gemini extracts clinical drug entities, quantities, and urgency levels into validated structured JSON.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative group hover:border-blue-300 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg mb-4 border border-amber-100">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1 font-['Outfit']">Combinatorial Engine</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our algorithm sweeps local pharmacy combinations to find the fastest set fulfilling 100% of items.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs relative group hover:border-emerald-300 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#2E7D32] flex items-center justify-center font-bold text-lg mb-4 border border-emerald-200">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1 font-['Outfit']">Parallel Fulfilment</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Couriers dispatch concurrently from optimal hubs. Complete prescription arrives in as little as 15 mins.
            </p>
          </div>
        </div>
      </section>

      {/* Head-to-Head Comparison Card */}
      <section className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400">
              Real-World Problem vs MediRush Innovation
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-['Outfit']">
              Why finding the "store with the most medicines" fails
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Normal Way */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Traditional Delivery
                </span>
                <span className="text-xs text-slate-400">Single Pharmacy</span>
              </div>
              <h4 className="text-xl font-bold font-['Outfit'] text-slate-200">
                Wellness Forever Mega Store (5.8 km)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                App selects a distant mega-store because it has all medicines in one warehouse. 
                Preparation queue takes 14 mins + 22 mins travel through city traffic.
              </p>
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-rose-300 font-medium">Estimated Arrival</div>
                  <div className="text-2xl font-black text-rose-400 font-['Outfit']">~36 – 40 mins</div>
                </div>
                <div className="text-right text-xs text-rose-300/80">
                  Single delivery courier<br/>High transit delay
                </div>
              </div>
            </div>

            {/* The MediRush Way */}
            <div className="bg-gradient-to-br from-blue-900/60 to-emerald-950/40 rounded-2xl p-6 border border-emerald-500/30 space-y-4 relative">
              <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                MediRush Smart Engine
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Zap className="w-4 h-4" /> Parallel Multi-Hub
              </div>
              <h4 className="text-xl font-bold font-['Outfit'] text-white">
                Apollo (1.2 km) + MedPlus (1.8 km)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                MediRush assigns 3 items to Apollo and 2 items to MedPlus. Both express hubs pack and dispatch at the exact same moment.
              </p>
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs text-emerald-300 font-medium">Parallel Delivery ETA</div>
                  <div className="text-2xl font-black text-emerald-400 font-['Outfit']">~15 mins</div>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-emerald-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg">
                    Saves 21 Minutes!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1-Click Judge Presets */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold font-['Outfit'] text-slate-900">
              Interactive Hackathon Scenarios
            </h3>
            <p className="text-xs text-slate-500">
              Click any realistic prescription to run the AI extraction and optimization pipeline instantly.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_PRESCRIPTIONS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onSelectSample(preset)}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#1565C0] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    preset.urgency === 'emergency' 
                      ? 'bg-rose-100 text-rose-800' 
                      : preset.urgency === 'urgent'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {preset.urgency}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {preset.medicines.length} items
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm font-['Outfit'] group-hover:text-[#1565C0] transition">
                  {preset.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {preset.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1565C0]">
                <span>Load Scenario</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
