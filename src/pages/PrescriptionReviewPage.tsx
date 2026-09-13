import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  Plus, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  ShieldCheck, 
  Check, 
  Package, 
  Info,
  Clock
} from 'lucide-react';
import { PrescriptionAnalysisResult, ExtractedPrescriptionMedicine } from '../services/gemini/prescriptionAnalyzer';
import { StructuredMedicineRequest, UrgencyLevel } from '../types';

interface PrescriptionReviewPageProps {
  analysisResult: PrescriptionAnalysisResult;
  onConfirmMedicines: (structuredRequest: StructuredMedicineRequest) => void;
  onBackToUpload: () => void;
  isOptimizing?: boolean;
}

export const PrescriptionReviewPage: React.FC<PrescriptionReviewPageProps> = ({
  analysisResult,
  onConfirmMedicines,
  onBackToUpload,
  isOptimizing = false,
}) => {
  const [medicines, setMedicines] = useState<ExtractedPrescriptionMedicine[]>(analysisResult.medicines);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStrength, setEditStrength] = useState('');
  const [editQty, setEditQty] = useState(1);
  const [editUnit, setEditUnit] = useState('tablet');
  const [editInstructions, setEditInstructions] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('normal');

  // Animation step progression during optimization
  const [optStep, setOptStep] = useState(1);
  useEffect(() => {
    if (isOptimizing) {
      setOptStep(1);
      const t1 = setTimeout(() => setOptStep(2), 250);
      const t2 = setTimeout(() => setOptStep(3), 550);
      const t3 = setTimeout(() => setOptStep(4), 850);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [isOptimizing]);

  const startEdit = (item: ExtractedPrescriptionMedicine) => {
    setEditingId(item.id);
    setEditName(item.medicineName || item.rawName || '');
    setEditStrength(item.strength || '');
    setEditQty(item.quantity || 1);
    setEditUnit(item.unit || 'tablet');
    setEditInstructions(item.instructions || '');
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    setMedicines(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          medicineName: editName.trim(),
          strength: editStrength.trim() || undefined,
          quantity: Math.max(1, editQty),
          unit: editUnit.trim() || 'tablet',
          instructions: editInstructions.trim() || undefined,
          needsConfirmation: false,
          confidence: 1.0,
        };
      }
      return m;
    }));
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const removeMedicine = (id: string) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
  };

  const selectCandidate = (id: string, candidate: string) => {
    setMedicines(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          medicineName: candidate,
          needsConfirmation: false,
          confidence: 0.95,
        };
      }
      return m;
    }));
  };

  const handleConfirm = () => {
    // Convert to existing StructuredMedicineRequest format
    const structuredReq: StructuredMedicineRequest = {
      medicines: medicines.map(m => ({
        name: m.medicineName || m.rawName,
        quantity: m.quantity || 1,
        unit: m.unit || 'tablet',
      })),
      urgency,
      user_note: 'Extracted from uploaded medical prescription',
    };

    onConfirmMedicines(structuredReq);
  };

  const hasUncertainItems = medicines.some(m => m.needsConfirmation);

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8 animate-fadeIn relative">
      {/* 4-Stage Optimization Loading Overlay */}
      {isOptimizing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1565C0] text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
              <Sparkles className="w-8 h-8 animate-spin-slow" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold font-['Outfit'] text-slate-900">
                Finding the fastest way to fulfil your prescription...
              </h3>
              <p className="text-xs text-slate-500">
                Evaluating combinatorial pharmacy routes across local network
              </p>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold flex items-center gap-2 ${optStep >= 1 ? 'text-[#1565C0]' : 'text-slate-400'}`}>
                  {optStep >= 1 ? <Check className="w-4 h-4 text-emerald-600" /> : <div className="w-2 h-2 rounded-full bg-slate-300 ml-1" />}
                  Reading prescription requirements
                </span>
                {optStep >= 1 && <span className="text-[10px] text-emerald-600 font-bold">Done</span>}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold flex items-center gap-2 ${optStep >= 2 ? 'text-[#1565C0]' : 'text-slate-400'}`}>
                  {optStep >= 2 ? <Check className="w-4 h-4 text-emerald-600" /> : <div className="w-2 h-2 rounded-full bg-slate-300 ml-1" />}
                  Checking pharmacy availability
                </span>
                {optStep >= 2 && <span className="text-[10px] text-emerald-600 font-bold">Done</span>}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold flex items-center gap-2 ${optStep >= 3 ? 'text-[#1565C0]' : 'text-slate-400'}`}>
                  {optStep >= 3 ? <Check className="w-4 h-4 text-emerald-600" /> : <div className="w-2 h-2 rounded-full bg-slate-300 ml-1" />}
                  Comparing fulfilment plans
                </span>
                {optStep >= 3 && <span className="text-[10px] text-emerald-600 font-bold">Done</span>}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold flex items-center gap-2 ${optStep >= 4 ? 'text-[#1565C0]' : 'text-slate-400'}`}>
                  {optStep >= 4 ? <Check className="w-4 h-4 text-emerald-600" /> : <div className="w-2 h-2 rounded-full bg-slate-300 ml-1" />}
                  Selecting the fastest complete plan
                </span>
                {optStep >= 4 && <span className="text-[10px] text-emerald-600 font-bold">Optimal</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-[#2E7D32] border border-emerald-200 text-xs font-bold shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Gemini Vision Extraction Complete</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] text-slate-900 tracking-tight">
          Here's what MediRush found
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Review the medicines extracted from your prescription before we search for fulfilment.
        </p>
      </div>

      {/* Top Banner & Source Badge */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold">
            <FileText className="w-5 h-5 text-[#1565C0]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>{medicines.length} Medicines Identified</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-blue-100 text-[#1565C0]">
                Source: Prescription
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {analysisResult.source === 'gemini_vision'
                ? 'Gemini Vision AI extraction'
                : 'Synthetic clinical demonstration prescription'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToUpload}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change image</span>
        </button>
      </div>

      {/* Uncertain items warning banner if applicable */}
      {hasUncertainItems && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900 shadow-xs animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 text-sm font-['Outfit']">Action required on unclear medicines</h4>
            <p className="leading-relaxed">
              Some prescription details could not be read confidently. Please confirm or edit the highlighted entries before continuing.
            </p>
          </div>
        </div>
      )}

      {/* Extracted Medicine Cards */}
      <div className="space-y-4">
        {medicines.map((med, index) => {
          const isEditing = editingId === med.id;

          if (isEditing) {
            return (
              <div key={med.id} className="bg-white rounded-2xl border-2 border-[#1565C0] p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-[#1565C0]">Edit Medicine #{index + 1}</span>
                  <span className="text-xs text-slate-400">Detected: "{med.rawName}"</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Medicine Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#1565C0] focus:bg-white outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Strength</label>
                    <input
                      type="text"
                      value={editStrength}
                      onChange={e => setEditStrength(e.target.value)}
                      placeholder="e.g. 650 mg"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#1565C0] focus:bg-white outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={editQty}
                      onChange={e => setEditQty(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#1565C0] focus:bg-white outline-none text-center"
                    />
                  </div>
                  <div className="sm:col-span-12">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Prescription Instruction</label>
                    <input
                      type="text"
                      value={editInstructions}
                      onChange={e => setEditInstructions(e.target.value)}
                      placeholder="e.g. 1 tablet after food (1-0-1)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#1565C0] focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => saveEdit(med.id)}
                    className="px-4 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={med.id}
              className={`bg-white rounded-3xl border p-5 shadow-xs transition-all space-y-3 ${
                med.needsConfirmation 
                  ? 'border-amber-300 bg-amber-50/20' 
                  : 'border-slate-200/90 hover:border-[#1565C0]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold font-['Outfit'] text-slate-900">
                      {med.medicineName || med.rawName}
                    </h3>

                    {med.needsConfirmation ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        Needs confirmation
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        High confidence
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">
                    Detected text: <span className="font-mono text-slate-600">"{med.rawName}"</span>
                  </p>
                </div>

                {/* Edit & Remove Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(med)}
                    className="p-2 text-slate-500 hover:text-[#1565C0] hover:bg-blue-50 rounded-xl transition cursor-pointer"
                    title="Edit medicine details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMedicine(med.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Medicine details row */}
              <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                {med.strength && (
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 font-bold text-slate-700">
                    {med.strength}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-xl bg-slate-100 font-bold text-slate-700">
                  {med.quantity ? `${med.quantity} ${med.unit || 'units'}` : 'Quantity not specified'}
                </span>
                {med.form && (
                  <span className="text-slate-400">
                    Form: <strong className="text-slate-600 capitalize">{med.form}</strong>
                  </span>
                )}
              </div>

              {/* Prescription instruction */}
              {med.instructions && (
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 text-xs text-slate-600">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block mb-0.5">
                    Prescription instruction:
                  </span>
                  <span className="font-medium text-slate-800">{med.instructions}</span>
                </div>
              )}

              {/* Candidate suggestions if uncertain */}
              {med.needsConfirmation && med.uncertainCandidates && med.uncertainCandidates.length > 0 && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 space-y-2">
                  <span className="text-[11px] font-bold text-amber-900 block">
                    Did the doctor mean one of these?
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {med.uncertainCandidates.map((cand, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => selectCandidate(med.id, cand)}
                        className="text-xs px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 font-semibold rounded-lg border border-amber-300 transition cursor-pointer"
                      >
                        ✓ Select {cand}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trust & Medical Safety Note (Section 24) */}
      <div className="bg-slate-100/90 rounded-2xl p-4 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-500">
        <ShieldCheck className="w-5 h-5 text-[#1565C0] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Medical Safety Notice:</strong> Prescription extraction helps identify what is written in the uploaded image. Always review the extracted medicines before ordering. MediRush does not diagnose or modify prescriptions.
        </p>
      </div>

      {/* Confirmation Bottom Bar (Section 18) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Prescription Summary
          </span>
          <span className="text-base font-extrabold text-slate-900 font-['Outfit']">
            {medicines.length} medicines ready for fulfilment
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBackToUpload}
            className="w-1/2 sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
          >
            Edit prescription
          </button>

          <button
            type="button"
            disabled={medicines.length === 0 || isOptimizing}
            onClick={handleConfirm}
            className="w-1/2 sm:w-auto px-7 py-3 rounded-2xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>Confirm medicines</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
