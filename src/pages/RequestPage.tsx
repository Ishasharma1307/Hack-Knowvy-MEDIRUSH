import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Bot, 
  Pill, 
  Flame, 
  Check, 
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Zap
} from 'lucide-react';
import { MedicineItem, UrgencyLevel, SamplePrescription } from '../types';
import { SAMPLE_PRESCRIPTIONS } from '../data/samplePrescriptions';
import { getDemoPrescriptionFallback } from '../services/ai/geminiService';

interface RequestPageProps {
  onAnalyze: (prompt: string, manualItems?: MedicineItem[], urgency?: UrgencyLevel) => Promise<void>;
  isLoading: boolean;
  prefillSample?: SamplePrescription | null;
  errorMessage?: string | null;
}

export const RequestPage: React.FC<RequestPageProps> = ({ 
  onAnalyze, 
  isLoading, 
  prefillSample,
  errorMessage 
}) => {
  const [promptText, setPromptText] = useState(prefillSample?.rawText || '');
  const [urgency, setUrgency] = useState<UrgencyLevel>(prefillSample?.urgency || 'urgent');
  const [entryMode, setEntryMode] = useState<'text' | 'manual'>('text');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Animated processing steps for premium AI state
  const [processStep, setProcessStep] = useState(0);

  useEffect(() => {
    if (prefillSample) {
      setPromptText(prefillSample.rawText);
      setUrgency(prefillSample.urgency);
      if (prefillSample.medicines && prefillSample.medicines.length > 0) {
        setManualItems(prefillSample.medicines);
      }
    }
  }, [prefillSample]);

  // Handle processing step progression during loading
  useEffect(() => {
    if (isLoading) {
      setProcessStep(1);
      const t1 = setTimeout(() => setProcessStep(2), 300);
      const t2 = setTimeout(() => setProcessStep(3), 650);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setProcessStep(0);
    }
  }, [isLoading]);

  // Manual items state
  const [manualItems, setManualItems] = useState<MedicineItem[]>(
    prefillSample?.medicines || [
      { id: '1', name: 'Dolo 650', quantity: 2, unit: 'strip', dosage: '650mg', urgency: 'urgent', notes: 'Fever' },
      { id: '2', name: 'Azithromycin 500mg', quantity: 1, unit: 'strip', dosage: '500mg', urgency: 'urgent', notes: 'Antibiotic' },
    ]
  );
  const [newMedName, setNewMedName] = useState('');
  const [newMedQty, setNewMedQty] = useState(1);
  const [newMedUnit, setNewMedUnit] = useState('strip');
  const [newMedDosage, setNewMedDosage] = useState('');

  const handleAddManualItem = () => {
    if (!newMedName.trim()) return;
    const newItem: MedicineItem = {
      id: `manual_${Date.now()}`,
      name: newMedName.trim(),
      quantity: Number(newMedQty) || 1,
      unit: newMedUnit.trim() || 'strip',
      dosage: newMedDosage.trim(),
      urgency,
      notes: 'Manually added',
    };
    setManualItems([...manualItems, newItem]);
    setNewMedName('');
    setNewMedQty(1);
    setNewMedDosage('');
  };

  const handleRemoveManualItem = (id: string) => {
    setManualItems(manualItems.filter(item => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (entryMode === 'text') {
      if (!promptText.trim()) {
        setValidationError("Please enter your medicine requirements or prescription text.");
        return;
      }
      onAnalyze(promptText, undefined, urgency);
    } else {
      if (manualItems.length === 0) {
        setValidationError("Please add at least one medicine item to your list.");
        return;
      }
      onAnalyze('', manualItems, urgency);
    }
  };

  const handleQuickPrompt = (sample: SamplePrescription) => {
    setPromptText(sample.rawText);
    setUrgency(sample.urgency);
    setEntryMode('text');
    setValidationError(null);
  };

  const handleLoadDemoFallback = () => {
    const demo = getDemoPrescriptionFallback();
    setManualItems(demo.medicines);
    setUrgency(demo.urgency);
    setPromptText("I need Dolo 650, Pantoprazole, Azithromycin, ORS, and Cetirizine urgently.");
    setValidationError(null);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8 animate-fadeIn">
      {/* Title & Subtitle */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#1565C0] text-xs font-bold border border-blue-200">
          <Bot className="w-3.5 h-3.5" />
          <span>Clinical Request Ingestion</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight">
          What medicines do you need?
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Describe your prescription naturally or enter items directly. Gemini standardizes medicines and quantities, then you confirm before fulfilment.
        </p>
      </div>

      {/* Global Validation / Error Notice if any */}
      {(validationError || errorMessage) && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start justify-between gap-3 text-xs text-rose-800 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{validationError || errorMessage}</p>
              <p className="text-[11px] text-rose-600 mt-0.5">
                Tip: You can also switch to manual entry or click the Demo Preset below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLoadDemoFallback}
            className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold rounded-xl transition shrink-0"
          >
            Load Demo Presets
          </button>
        </div>
      )}

      {/* Mode Selector */}
      <div className="flex items-center justify-center gap-2">
        <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setEntryMode('text')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              entryMode === 'text'
                ? 'bg-white text-[#1565C0] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Natural Language AI Input
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('manual')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              entryMode === 'manual'
                ? 'bg-white text-[#1565C0] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manual Medicine Entry
          </button>
        </div>
      </div>

      {/* Main Request Form */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-blue-500/5 p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Loading Overlay with Step Animations */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1565C0] to-[#1E88E5] flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
              <Sparkles className="w-8 h-8 animate-spin-slow" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-xl font-bold font-['Outfit'] text-slate-900">
                Understanding your medicine request...
              </h3>
              <p className="text-xs text-slate-500">
                Gemini is extracting clinical drug taxonomy and quantities
              </p>
            </div>

            <div className="w-full max-w-sm space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold flex items-center gap-2 ${processStep >= 1 ? 'text-[#1565C0]' : 'text-slate-400'}`}>
                  {processStep >= 1 ? <Check className="w-4 h-4 text-emerald-600" /> : <div className="w-2 h-2 rounded-full bg-slate-300 ml-1" />}
                  Reading medicine requirements
                </span>
                {processStep >= 1 && <span className="text-[10px] text-emerald-600 font-bold">Done</span>}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold flex items-center gap-2 ${processStep >= 2 ? 'text-[#1565C0]' : 'text-slate-400'}`}>
                  {processStep >= 2 ? <Check className="w-4 h-4 text-emerald-600" /> : <div className="w-2 h-2 rounded-full bg-slate-300 ml-1" />}
                  Identifying urgency & context
                </span>
                {processStep >= 2 && <span className="text-[10px] text-emerald-600 font-bold">Done</span>}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold flex items-center gap-2 ${processStep >= 3 ? 'text-[#1565C0]' : 'text-slate-400'}`}>
                  {processStep >= 3 ? <Check className="w-4 h-4 text-emerald-600" /> : <div className="w-2 h-2 rounded-full bg-slate-300 ml-1" />}
                  Preparing structured request
                </span>
                {processStep >= 3 && <span className="text-[10px] text-emerald-600 font-bold">Ready</span>}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {entryMode === 'text' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Prescription Request
                </label>
                <span className="text-[11px] text-slate-400">
                  Natural wording supported (e.g. 2 strips of Dolo 650)
                </span>
              </div>

              <div className="relative">
                <textarea
                  rows={4}
                  value={promptText}
                  onChange={(e) => {
                    setPromptText(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Example: I need Dolo 650, Pantoprazole and ORS urgently."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565C0] focus:bg-white transition resize-none leading-relaxed"
                />
              </div>

              {/* Demo Quick Requests Chips (Prompt 5 Section 7) */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Demo Quick Requests:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPromptText("I need Dolo 650, Pantoprazole, Azithromycin, ORS and Cetirizine urgently.");
                      setUrgency("urgent");
                      if (validationError) setValidationError(null);
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-blue-50 text-[#1565C0] font-bold border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>5-medicine urgent request (Scenario A)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPromptText("I need Dolo 650, Pantoprazole and Azithromycin.");
                      setUrgency("normal");
                      if (validationError) setValidationError(null);
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-[#2E7D32] font-semibold border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    3 medicines
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPromptText("I need Dolo 650, Pantoprazole and Azithromycin.");
                      setUrgency("normal");
                      if (validationError) setValidationError(null);
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition cursor-pointer"
                  >
                    Single pharmacy request
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPromptText("I need Dolo 650, Pantoprazole, and RareSpecialtyDrugX.");
                      setUrgency("urgent");
                      if (validationError) setValidationError(null);
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium border border-amber-200 transition cursor-pointer"
                  >
                    Unavailable drug (Scenario C)
                  </button>
                </div>
              </div>

              {/* Or add medicines manually toggle */}
              <div className="pt-2 text-center sm:text-left">
                <button
                  type="button"
                  onClick={() => setEntryMode('manual')}
                  className="text-xs font-bold text-[#1565C0] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Or add medicines manually (name, quantity, unit)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Manual Entry Mode */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Add Medicine Items
                </label>
                <span className="text-xs text-slate-400 font-semibold">
                  {manualItems.length} items queued
                </span>
              </div>

              {/* Add form row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    placeholder="Medicine name (e.g. Dolo 650)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#1565C0] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min={1}
                    value={newMedQty}
                    onChange={(e) => setNewMedQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#1565C0] focus:outline-none text-center"
                    placeholder="Qty"
                  />
                </div>
                <div className="sm:col-span-2">
                  <select
                    value={newMedUnit}
                    onChange={(e) => setNewMedUnit(e.target.value)}
                    className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#1565C0] focus:outline-none"
                  >
                    <option value="strip">strip</option>
                    <option value="tablet">tablet</option>
                    <option value="bottle">bottle</option>
                    <option value="box">box</option>
                    <option value="pack">pack</option>
                    <option value="sachet">sachet</option>
                    <option value="inhaler">inhaler</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    placeholder="Dosage (optional)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#1565C0] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddManualItem}
                    className="w-full h-full min-h-8 bg-[#1565C0] text-white rounded-xl flex items-center justify-center hover:bg-[#0D47A1] transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* List of items */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {manualItems.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    No medicines added yet. Type above and click "+".
                  </div>
                ) : (
                  manualItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold text-xs">
                          <Pill className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{item.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Qty: {item.quantity} {item.unit || 'strip'} {item.dosage ? `• ${item.dosage}` : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveManualItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Urgency Level Picker */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Urgency Classification
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setUrgency('normal')}
                className={`p-3 rounded-2xl border text-left transition ${
                  urgency === 'normal'
                    ? 'border-[#1565C0] bg-blue-50/70 text-[#1565C0] ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="text-xs font-bold">Normal</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Regular / Routine Refill</div>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('urgent')}
                className={`p-3 rounded-2xl border text-left transition ${
                  urgency === 'urgent'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-800 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="text-xs font-bold flex items-center gap-1 text-amber-700">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> Urgent
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Fever / Acute Need (Default)</div>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('emergency')}
                className={`p-3 rounded-2xl border text-left transition ${
                  urgency === 'emergency'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-800 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <div className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-600" /> Emergency
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Priority Dispatch Route</div>
              </button>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-base shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5 text-blue-200" />
              <span>Understand my request</span>
            </button>
          </div>
        </form>
      </div>

      {/* Medical Safety Card */}
      <div className="bg-slate-100/90 rounded-2xl p-4 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-500">
        <Bot className="w-4 h-4 text-[#1565C0] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Safe Clinical Understanding:</strong> Gemini acts strictly as an interpretation layer. It structures the items you explicitly request or those on your doctor's prescription. It never prescribes medications, alters dosage, or recommends substitutions.
        </p>
      </div>
    </div>
  );
};
