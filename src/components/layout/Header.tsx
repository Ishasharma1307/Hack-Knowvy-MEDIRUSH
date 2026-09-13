import React, { useState } from 'react';
import { Zap, Sparkles, Settings, Pill, Activity } from 'lucide-react';
import { ApiKeyModal } from '../modal/ApiKeyModal';
import { getStoredGeminiApiKey } from '../../services/ai/geminiService';

interface HeaderProps {
  currentView: 'home' | 'request' | 'understanding' | 'results' | 'tracking';
  onNavigate: (view: 'home' | 'request') => void;
  onReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onReset }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const hasCustomKey = !!getStoredGeminiApiKey();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo & Brand */}
          <div 
            onClick={() => {
              if (onReset) onReset();
              onNavigate('home');
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1565C0] to-[#1E88E5] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-['Outfit'] font-black text-2xl tracking-tight text-slate-900">
                  Medi<span className="text-[#1565C0]">Rush</span>
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-[#1565C0] border border-blue-200/60">
                  <Activity className="w-3 h-3" /> MVP
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 -mt-1 hidden sm:block">
                Intelligent Multi-Pharmacy Fulfilment
              </p>
            </div>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => {
                if (onReset) onReset();
                onNavigate('home');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                currentView === 'home'
                  ? 'bg-white text-[#1565C0] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('request')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentView !== 'home'
                  ? 'bg-[#1565C0] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              Order Medicines
            </button>
          </nav>

          {/* Status & Actions */}
          <div className="flex items-center gap-2.5">
            {/* AI Status Badge */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#2E7D32] border border-emerald-200 hover:bg-emerald-100/70 transition"
              title="Click to view AI engine & API keys"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
              <span className="hidden sm:inline">
                {hasCustomKey ? 'Gemini 2.5 Active' : 'Gemini Ready'}
              </span>
              <span className="sm:hidden">AI</span>
            </button>

            {/* Config modal trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
              title="Settings & API Key"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};
