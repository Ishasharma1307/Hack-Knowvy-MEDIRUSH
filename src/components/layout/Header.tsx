import React from 'react';
import { Zap, Pill, Activity, Sparkles, MapPin } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'request' | 'understanding' | 'results' | 'tracking';
  onNavigate: (view: 'home' | 'request') => void;
  onReset?: () => void;
  userLocationAddress?: string;
  onDetectLocation?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  onNavigate, 
  onReset,
  userLocationAddress,
  onDetectLocation,
}) => {
  return (
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
              Smart medicine fulfilment
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
            Home
          </button>
          <button
            onClick={() => {
              if (currentView !== 'home') {
                onNavigate('home');
              }
              setTimeout(() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/50 transition-all"
          >
            How it works
          </button>
        </nav>

        {/* Right Side — Actions */}
        <div className="flex items-center gap-2.5">
          {/* Primary Action Button */}
          <button
            onClick={() => onNavigate('request')}
            className="px-4 py-2 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold shadow-sm shadow-blue-500/20 hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Find medicines</span>
          </button>

          {/* Live User Location Badge */}
          {userLocationAddress && (
            <div
              onClick={onDetectLocation}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-[#1565C0] border border-blue-200 cursor-pointer hover:bg-blue-100/80 transition"
              title="Click to refresh your live GPS location"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate max-w-[150px]">{userLocationAddress}</span>
            </div>
          )}

          {/* AI Status Badge — just a display, no click */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#2E7D32] border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin-slow" />
            <span>Gemini AI Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
