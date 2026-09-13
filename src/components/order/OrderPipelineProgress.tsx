import React from 'react';
import { Check, Loader2, MapPin, Search, Database, ShieldCheck, Sparkles } from 'lucide-react';

export interface OrderPipelineProgressProps {
  currentStep: number; // 1 to 4
  stepDetails?: string;
  providerType?: 'google_maps' | 'demo';
}

const STEPS = [
  {
    step: 1,
    title: 'Finding nearby pharmacies...',
    subtitle: 'Accessing user location & querying Google Maps / Gemini Places',
    icon: MapPin,
  },
  {
    step: 2,
    title: 'Checking medicine availability...',
    subtitle: 'Querying MediRush verified pharmacy inventory dataset',
    icon: Database,
  },
  {
    step: 3,
    title: 'Finding the nearest pharmacy with your complete request...',
    subtitle: 'Filtering for 100% stock coverage and minimum delivery ETA',
    icon: Search,
  },
  {
    step: 4,
    title: 'Creating your order...',
    subtitle: 'Generating order confirmation & reserving pharmacy inventory',
    icon: ShieldCheck,
  },
];

export const OrderPipelineProgress: React.FC<OrderPipelineProgressProps> = ({
  currentStep,
  stepDetails,
  providerType,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1565C0] text-xs font-bold border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
            <span>MediRush Smart Order Pipeline</span>
          </div>
          <h3 className="text-2xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight">
            Processing Your Prescription Order
          </h3>
          <p className="text-xs text-slate-500">
            Evaluating top 5 nearby pharmacy candidates against verified inventory
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-4 py-2">
          {STEPS.map((s) => {
            const isDone = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            const isPending = currentStep < s.step;

            const Icon = s.icon;

            return (
              <div
                key={s.step}
                className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                    : isDone
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50/40 border-slate-200/60 opacity-60'
                }`}
              >
                {/* Step Icon / Status indicator */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                      : isCurrent
                      ? 'bg-[#1565C0] text-white shadow-sm shadow-blue-500/30'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                {/* Step Text */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold block ${
                        isCurrent
                          ? 'text-[#1565C0]'
                          : isDone
                          ? 'text-emerald-900'
                          : 'text-slate-600'
                      }`}
                    >
                      {s.title}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        Done
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {s.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Step details or provider notice */}
        {stepDetails && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 font-mono text-center truncate">
            {stepDetails}
          </div>
        )}

        {providerType && (
          <div className="text-center">
            <span className="text-[10px] text-slate-400">
              Discovery Engine: {providerType === 'google_maps' ? 'Google Maps Grounded Places' : 'Demo pharmacy network'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
