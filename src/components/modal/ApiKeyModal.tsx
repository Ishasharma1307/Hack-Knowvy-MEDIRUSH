import React, { useState } from 'react';
import { Key, ShieldCheck, Check, Sparkles, X, Database } from 'lucide-react';
import { getStoredGeminiApiKey, saveGeminiApiKey, clearGeminiApiKey } from '../../services/ai/geminiService';
import { isSupabaseConfigured } from '../../services/supabase/client';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [apiKey, setApiKey] = useState(getStoredGeminiApiKey());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveGeminiApiKey(apiKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onSave) onSave();
      onClose();
    }, 800);
  };

  const handleClear = () => {
    clearGeminiApiKey();
    setApiKey('');
    if (onSave) onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1565C0] to-[#0D47A1] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Key className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-['Outfit']">System Connectivity & Keys</h3>
              <p className="text-xs text-blue-100 mt-0.5">Configure Gemini AI & Supabase integrations</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Gemini API Key (Optional)
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy... (leave blank to use built-in NLP parser)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1565C0] focus:bg-white transition"
              />
            </div>
            <div className="flex items-start gap-2 mt-2 text-xs text-slate-500">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Zero-Risk Failsafe:</strong> If no key is provided, MediRush automatically runs on its clinical NLP offline engine. All prescription analysis, combinatorial pharmacy routing, and map visualizations continue working 100%!
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-[#1565C0]" />
              <div>
                <p className="text-xs font-bold text-slate-800">Pharmacy Data Source</p>
                <p className="text-[11px] text-slate-500">
                  {isSupabaseConfigured() ? 'Supabase Live Connection' : 'High-Fidelity Demo Geospatial Dataset (Active)'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
              Ready
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Medical Safety Guardrail:</strong> MediRush never prescribes or replaces medications. AI extracts prescription details, and the optimization engine computes the fastest delivery combination.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition"
              >
                Clear Key
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#1565C0] hover:bg-[#0D47A1] rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved!
                </>
              ) : (
                'Save Configuration'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
