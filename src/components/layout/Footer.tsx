import React from 'react';
import { ShieldCheck, Heart, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1565C0] flex items-center justify-center text-white">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="font-['Outfit'] font-bold text-slate-800 text-sm">MediRush MVP</span>
            <p className="text-[11px] text-slate-400">Intelligent Multi-Store Combinatorial Prescription Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
          <span>Demo Data Only • Does not provide clinical diagnoses or prescription alterations</span>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1">
          Built for Hackathon with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
        </div>
      </div>
    </footer>
  );
};
