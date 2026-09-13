import React from 'react';
import { 
  Zap, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Cpu, 
  Store, 
  Sparkles, 
  Layers, 
  Flame, 
  ShieldAlert,
  HelpCircle,
  Network,
  TrendingDown,
  Camera
} from 'lucide-react';
import { SamplePrescription } from '../types';
import { DEMO_SCENARIOS, DemoScenario } from '../config/demoConfig';

interface LandingPageProps {
  onStartOrder: () => void;
  onUploadPrescription?: () => void;
  onSelectSample: (sample: SamplePrescription) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartOrder, onUploadPrescription, onSelectSample }) => {
  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScenarioClick = (scenario: DemoScenario) => {
    onSelectSample({
      id: scenario.id,
      title: scenario.name,
      description: scenario.description,
      urgency: scenario.urgency,
      rawText: scenario.rawText,
      medicines: scenario.medicines,
    });
  };

  return (
    <div className="space-y-16 py-6 animate-fadeIn">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white via-white/90 to-blue-50/70 border border-blue-100/90 p-8 sm:p-12 lg:p-16 shadow-xl shadow-blue-500/5">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-[#1565C0] text-xs font-bold tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#1565C0]" />
            <span>Smart Multi-Pharmacy Fulfilment Platform</span>
          </div>

          {/* Main Title & Subheading */}
          <div className="space-y-2">
            <span className="text-base font-extrabold uppercase tracking-widest text-[#1565C0]">
              MediRush
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.08] font-['Outfit']">
              Your medicines.{' '}
              <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#1565C0] via-[#1E88E5] to-[#0D47A1]">
                The fastest way
              </span>{' '}
              to get them.
            </h1>
          </div>

          {/* Supporting text - Clear USP */}
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            When one pharmacy can't fulfil your complete request, MediRush finds the{' '}
            <span className="font-semibold text-slate-900">
              fastest combination of nearby pharmacies
            </span>{' '}
            to deliver everything together in parallel.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={onStartOrder}
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-base shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Find my medicines</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {onUploadPrescription && (
              <button
                onClick={onUploadPrescription}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-blue-50 text-[#1565C0] font-bold text-base border-2 border-blue-200 hover:border-blue-300 shadow-xs hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#1565C0]" />
                <span>Upload prescription</span>
              </button>
            )}

            <button
              onClick={scrollToHowItWorks}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/80 hover:bg-slate-50 text-slate-700 font-bold text-base border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>See how it works</span>
            </button>
          </div>

          {/* Core Trust Anchors */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
              <span>100% Complete Prescription Fulfilment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1565C0]" />
              <span>Parallel Multi-Courier Dispatch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Deterministic Routing Engine</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Visual Storytelling: ONE REQUEST -> MULTIPLE PHARMACIES -> FASTEST COMPLETE FULFILMENT */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400">
              Architecture Concept
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit']">
              One Request → Multiple Pharmacies → Fastest Complete Plan
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              How MediRush coordinates parallel express dispensing instead of relying on a single distant warehouse.
            </p>
          </div>

          {/* Visual Architecture Diagram */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Step 1: Patient Request */}
            <div className="lg:col-span-3 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">
                  Step 01
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300">
                  5 Items
                </span>
              </div>
              <h4 className="text-base font-bold font-['Outfit'] text-white">
                Patient Request
              </h4>
              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Dolo 650 (Fever)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Pantoprazole (Antacid)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Azithromycin (Antibiotic)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>ORS (Electrolyte)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Cetirizine (Allergy)</span>
                </div>
              </div>
            </div>

            {/* Connection Arrow */}
            <div className="lg:col-span-1 flex justify-center text-blue-400">
              <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0" />
            </div>

            {/* Step 2: Smart Fulfilment Engine */}
            <div className="lg:col-span-4 bg-gradient-to-br from-blue-900/60 via-slate-800/80 to-emerald-950/60 backdrop-blur-md rounded-2xl p-5 border border-emerald-500/30 space-y-3 relative shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> Engine
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300">
                  Real-Time Eval
                </span>
              </div>
              <h4 className="text-base font-bold font-['Outfit'] text-white">
                Smart Fulfilment Engine
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Evaluates combinations across 6 local pharmacies. Assigns medicines by stock and minimum travel time.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                  <span className="text-slate-400 block">Hub 1 (1.2 km)</span>
                  <span className="font-bold text-white">CityCare: 3 items</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                  <span className="text-slate-400 block">Hub 2 (1.8 km)</span>
                  <span className="font-bold text-white">QuickCare: 2 items</span>
                </div>
              </div>
            </div>

            {/* Connection Arrow */}
            <div className="lg:col-span-1 flex justify-center text-emerald-400">
              <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0" />
            </div>

            {/* Step 3: Fastest Complete Plan */}
            <div className="lg:col-span-3 bg-emerald-950/40 backdrop-blur-md rounded-2xl p-5 border border-emerald-400/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                  Outcome
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400 text-slate-950">
                  100% Fulfilled
                </span>
              </div>
              <h4 className="text-base font-bold font-['Outfit'] text-white">
                Fastest Complete Plan
              </h4>
              <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30 space-y-1">
                <div className="text-xs text-emerald-300 font-medium">Parallel Dispatch ETA</div>
                <div className="text-3xl font-black text-emerald-400 font-['Outfit']">~14 min</div>
                <div className="text-[11px] text-emerald-200">
                  16 min faster than single pharmacy
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "Why MediRush?" Section — Exactly 3 Cards */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#1565C0]">
            Core Advantage
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-slate-900">
            Why MediRush?
          </h2>
          <p className="text-sm text-slate-500">
            Engineered specifically to solve incomplete prescriptions and long delivery times.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Complete Request */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs hover:border-[#1565C0] hover:shadow-md transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold border border-blue-100 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-6 h-6 text-[#1565C0]" />
            </div>
            <h3 className="text-lg font-bold font-['Outfit'] text-slate-900">
              Complete Request
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Handles the complete medicine request rather than optimizing for one medicine. 
              Never leaves a patient with half of their prescription missing.
            </p>
          </div>

          {/* Card 2: Smart Combination */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs hover:border-[#1565C0] hover:shadow-md transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2E7D32] flex items-center justify-center font-bold border border-emerald-100 group-hover:scale-105 transition-transform">
              <Network className="w-6 h-6 text-[#2E7D32]" />
            </div>
            <h3 className="text-lg font-bold font-['Outfit'] text-slate-900">
              Smart Combination
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Compares multiple pharmacy combinations instead of blindly choosing one store. 
              Evaluates inventory quantities and geographic distances in real time.
            </p>
          </div>

          {/* Card 3: Faster Fulfilment */}
          <div className="bg-white p-7 rounded-3xl border border-slate-200/90 shadow-xs hover:border-[#1565C0] hover:shadow-md transition-all space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100 group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold font-['Outfit'] text-slate-900">
              Faster Fulfilment
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Selects the fastest valid combination based on available inventory and estimated fulfilment time. 
              Two close stores dispatching in parallel beat one distant warehouse.
            </p>
          </div>
        </div>
      </section>

      {/* "How It Works" Section — Exactly 3 Main Steps */}
      <section id="how-it-works" className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-xs space-y-8 scroll-mt-24">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1565C0] text-xs font-bold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini understands. MediRush optimizes.</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-slate-900">
            How MediRush Works
          </h2>
          <p className="text-sm text-slate-500">
            From natural language requirements to multi-courier dispatch in 3 steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 01 */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative">
            <div className="text-3xl font-black text-[#1565C0] font-['Outfit']">01</div>
            <h4 className="text-base font-bold font-['Outfit'] text-slate-900">
              Tell us what you need
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Type your medicine request in natural language. Gemini extracts medicine names, dosages, units, and urgency levels into structured clinical requirements.
            </p>
          </div>

          {/* Step 02 */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative">
            <div className="text-3xl font-black text-[#1565C0] font-['Outfit']">02</div>
            <h4 className="text-base font-bold font-['Outfit'] text-slate-900">
              MediRush analyzes availability
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pharmacy inventory and fulfilment options are evaluated across our network. The system verifies real stock quantities, locations, and travel ETAs.
            </p>
          </div>

          {/* Step 03 */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative">
            <div className="text-3xl font-black text-[#2E7D32] font-['Outfit']">03</div>
            <h4 className="text-base font-bold font-['Outfit'] text-slate-900">
              Get the fastest complete plan
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our Smart Fulfilment Engine evaluates candidate pharmacy combinations and selects the fastest valid plan that guarantees 100% request coverage.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Hackathon Scenarios — Scenario A, B, C */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold font-['Outfit'] text-slate-900">
              Interactive Hackathon Scenarios
            </h3>
            <p className="text-xs text-slate-500">
              Click any realistic scenario to verify the clinical parsing and Smart Fulfilment Engine.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Source: src/config/demoConfig.ts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(DEMO_SCENARIOS).map((scenario) => (
            <div
              key={scenario.id}
              onClick={() => handleScenarioClick(scenario)}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-[#1565C0] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    scenario.id === 'scenario-a' 
                      ? 'bg-blue-100 text-[#1565C0]' 
                      : scenario.id === 'scenario-b'
                      ? 'bg-emerald-100 text-[#2E7D32]'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {scenario.badge}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {scenario.medicines.length} items
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm font-['Outfit'] group-hover:text-[#1565C0] transition">
                  {scenario.name}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {scenario.description}
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
